import {
    AbstractAuthModuleProvider,
    MedusaError,
} from "@medusajs/framework/utils"
import {
    AuthenticationInput,
    AuthenticationResponse,
    AuthIdentityProviderService,
    Logger,
} from "@medusajs/types"
import { AbstractEventBusModuleService } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"
import { randomInt } from "crypto"

type InjectedDependencies = {
    logger: Logger
    event_bus: AbstractEventBusModuleService
}

type Options = {
    jwtSecret: string
}

export class OtpAuthProvider extends AbstractAuthModuleProvider {
    static identifier = "phone-auth"
    static DISPLAY_NAME = "OTP Authentication"

    protected logger_: Logger
    protected event_bus_: AbstractEventBusModuleService
    protected options_: Options

    constructor(
        dependencies: InjectedDependencies,
        options: Options
    ) {
        super()

        this.logger_ = dependencies.logger
        this.event_bus_ = dependencies.event_bus
        this.options_ = options
    }

    static validateOptions(options: Record<any, any>): void | never {
        if (!options.jwtSecret) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "JWT secret is required"
            )
        }
    }

    async register(
        data: AuthenticationInput,
        authIdentityProviderService: AuthIdentityProviderService
    ): Promise<AuthenticationResponse> {
        const { phone } = data.body || {}

        if (!phone) {
            return {
                success: false,
                error: "Phone number is required",
            }
        }

        try {
            await authIdentityProviderService.retrieve({
                entity_id: phone,
            })

            // ── Security: don't reveal whether the account exists ──────────
            // Returning a generic error prevents phone-number enumeration.
            return {
                success: false,
                error: "Unable to complete registration. Please try again.",
            }
        } catch {
            const user = await authIdentityProviderService.create({
                entity_id: phone,
            })

            return {
                success: true,
                authIdentity: user,
            }
        }
    }

    async authenticate(
        data: AuthenticationInput,
        authIdentityProviderService: AuthIdentityProviderService
    ): Promise<AuthenticationResponse> {
        const { phone } = data.body || {}

        if (!phone) {
            return {
                success: false,
                error: "Phone number is required",
            }
        }

        try {
            await authIdentityProviderService.retrieve({
                entity_id: phone,
            })
        } catch {
            // ── Security: generic error — don't leak account existence ─────
            return {
                success: false,
                error: "Unable to process request. Please try again.",
            }
        }

        const { hashedOTP, otp } = await this.generateOTP()

        // Overwrite any existing OTP, effectively invalidating the previous one
        await authIdentityProviderService.update(phone, {
            provider_metadata: {
                otp: hashedOTP,
                // Track when OTP was last issued (for audit / debugging)
                otp_issued_at: new Date().toISOString(),
            },
        })

        // In production, send `otp` via your SMS provider here.
        await this.event_bus_.emit([{
            name: "phone-auth.otp.generated",
            data: { phone, otp },
        }], {})

        // We log it in development only.
        if (process.env.NODE_ENV !== "production") {
            this.logger_.info(`OTP: Generated for ${phone}: ${otp}`)
        }

        return {
            success: true,
            location: "otp",
        }
    }

    async validateCallback(
        data: AuthenticationInput,
        authIdentityProviderService: AuthIdentityProviderService
    ): Promise<AuthenticationResponse> {
        const body = (data.body as any) || {}
        const query = (data as any).query || {}

        const phone = body.phone || body.phone_number || query.phone
        const otp = body.otp || body.code || query.otp || query.code

        if (!phone || !otp) {
            return {
                success: false,
                error: "Phone number and verification code are required",
            }
        }

        let user: any
        try {
            user = await authIdentityProviderService.retrieve({
                entity_id: phone,
            })
        } catch {
            // ── Security: generic error ────────────────────────────────────
            return { success: false, error: "Invalid request." }
        }

        if (!user) {
            return { success: false, error: "Invalid request." }
        }

        const userProvider = user.provider_identities?.find(
            (provider: any) => provider.provider === OtpAuthProvider.identifier
        )

        if (!userProvider?.provider_metadata?.otp) {
            return {
                success: false,
                error: "No verification code found. Please request a new one.",
            }
        }

        // ── Verify the OTP JWT ─────────────────────────────────────────────
        try {
            const decodedOTP = jwt.verify(
                userProvider.provider_metadata.otp as string,
                this.options_.jwtSecret
            ) as { otp: string }

            if (decodedOTP.otp !== otp) {
                // Wrong code — do NOT reveal why verification failed
                return { success: false, error: "Invalid verification code." }
            }
        } catch (error: any) {
            if (error.name === "TokenExpiredError") {
                // OTP has expired — tell the user they need a new one
                return {
                    success: false,
                    error: "Verification code has expired. Please request a new one.",
                }
            }
            // Any other JWT error (malformed, wrong secret, etc.)
            return { success: false, error: "Invalid verification code." }
        }

        // ── Success: clear the OTP so it can't be reused ──────────────────
        const updatedUser = await authIdentityProviderService.update(phone, {
            provider_metadata: {
                otp: null,
                otp_issued_at: null,
            },
        })

        return {
            success: true,
            authIdentity: updatedUser,
        }
    }

    async generateOTP(): Promise<{ hashedOTP: string, otp: string }> {
        // Generate a cryptographically strong 6-digit OTP using Node.js crypto module.
        // randomInt(min, max) returns a cryptographically secure integer in [min, max).
        // Math.random() is NOT suitable for security-sensitive codes.
        const otp = randomInt(100000, 1000000).toString()

        if (process.env.NODE_ENV !== "production") {
            this.logger_.info(`[phone-otp] Generated OTP for verification: ${otp}`)
        }

        const hashedOTP = jwt.sign({ otp }, this.options_.jwtSecret, {
            expiresIn: "5m", // 5 minutes
        })

        return { hashedOTP, otp }
    }
}
