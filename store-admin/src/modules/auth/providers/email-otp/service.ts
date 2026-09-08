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

export class EmailOtpAuthProvider extends AbstractAuthModuleProvider {
    static identifier = "email-otp"
    static DISPLAY_NAME = "Email OTP Authentication"

    protected logger_: Logger
    protected event_bus_: AbstractEventBusModuleService
    protected options_: Options

    constructor(
        dependencies: InjectedDependencies,
        options: Options
    ) {
        // @ts-ignore
        super(...arguments)

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

    /**
     * Registration step 1:
     * Creates a pending auth identity and returns it (like phone-auth).
     * The caller then uses the returned token to create the customer record,
     * then calls authenticate() to trigger OTP sending.
     *
     * NOTE: Medusa requires register() to return authIdentity (not location:"otp").
     */
    async register(
        data: AuthenticationInput,
        authIdentityProviderService: AuthIdentityProviderService
    ): Promise<AuthenticationResponse> {
        const { email } = data.body || {}

        if (!email) {
            return { success: false, error: "Email is required" }
        }

        try {
            const existing = await authIdentityProviderService.retrieve({
                entity_id: email,
            })

            // If a non-pending identity already exists → already registered
            const provider = existing.provider_identities?.find(
                (p) => p.provider === EmailOtpAuthProvider.identifier
            )
            if (!provider?.provider_metadata?.pending) {
                // ── Security: don't distinguish "exists" from other errors ─
                return {
                    success: false,
                    error: "Unable to complete registration. Please try again.",
                }
            }

            // Pending identity exists (e.g. re-trying registration) → reuse it
            this.logger_.info(`[email-otp] Re-using pending identity for ${email}`)
            return { success: true, authIdentity: existing }
        } catch {
            // No identity yet — create a pending one
            const user = await authIdentityProviderService.create({
                entity_id: email,
            })

            await authIdentityProviderService.update(email, {
                provider_metadata: { pending: true },
            })

            this.logger_.info(`[email-otp] Created pending identity for ${email}`)
            return { success: true, authIdentity: user }
        }
    }

    /**
     * Login/OTP-trigger step:
     * Sends OTP to the email. Works for BOTH:
     * - pending users (just registered, need email verification)
     * - active users (requesting OTP login)
     * - brand new users with no identity yet (auto-creates a pending identity)
     *
     * Any existing OTP is overwritten, effectively invalidating the old code.
     */
    async authenticate(
        data: AuthenticationInput,
        authIdentityProviderService: AuthIdentityProviderService
    ): Promise<AuthenticationResponse> {
        const { email } = data.body || {}

        if (!email) {
            return { success: false, error: "Email is required" }
        }

        let identity: any
        try {
            identity = await authIdentityProviderService.retrieve({
                entity_id: email,
            })
        } catch {
            return { success: false, error: "Invalid credentials" }
        }

        const { hashedOTP, otp } = await this.generateOTP()

        const existingMeta =
            identity.provider_identities?.find(
                (p: any) => p.provider === EmailOtpAuthProvider.identifier
            )?.provider_metadata ?? {}

        // Overwrite any existing OTP, effectively invalidating the previous one
        await authIdentityProviderService.update(email, {
            provider_metadata: {
                ...existingMeta,
                otp: hashedOTP,
                // Track when OTP was last issued (for audit / debugging)
                otp_issued_at: new Date().toISOString(),
            },
        })

        if (process.env.NODE_ENV !== "production") {
            this.logger_.info(`[email-otp] OTP for ${email}: ${otp}`)
        }

        await this.event_bus_.emit(
            { name: "email-auth.otp.generated", data: { otp, email } },
            {}
        )

        return { success: true, location: "otp" }
    }

    /**
     * OTP verification step (shared for registration and login).
     * On success: OTP is cleared and pending flag is removed.
     */
    async validateCallback(
        data: AuthenticationInput,
        authIdentityProviderService: AuthIdentityProviderService
    ): Promise<AuthenticationResponse> {
        const body = (data.body as any) || {}
        const query = (data as any).query || {}

        const email = body.email || query.email
        const otp = body.otp || body.code || query.otp || query.code

        if (!email || !otp) {
            return { success: false, error: "Email and verification code are required" }
        }

        let user: any
        try {
            user = await authIdentityProviderService.retrieve({
                entity_id: email,
            })
        } catch {
            // ── Security: generic error ────────────────────────────────────
            return { success: false, error: "Invalid request." }
        }

        const userProvider = user.provider_identities?.find(
            (p: any) => p.provider === EmailOtpAuthProvider.identifier
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

        // ── Success: clear OTP and pending flag so code can't be reused ───
        const updatedUser = await authIdentityProviderService.update(email, {
            provider_metadata: {
                otp: null,
                otp_issued_at: null,
                pending: false,
            },
        })

        this.logger_.info(`[email-otp] OTP verified for ${email}`)

        return { success: true, authIdentity: updatedUser }
    }

    async generateOTP(): Promise<{ hashedOTP: string; otp: string }> {
        // Generate a cryptographically strong 6-digit OTP using Node.js crypto module.
        // randomInt(min, max) returns a cryptographically secure integer in [min, max).
        // Math.random() is NOT suitable for security-sensitive codes.
        const otp = randomInt(100000, 1000000).toString()

        if (process.env.NODE_ENV !== "production") {
            this.logger_.info(`[email-otp] Generated OTP: ${otp}`)
        }

        const hashedOTP = jwt.sign({ otp }, this.options_.jwtSecret, {
            expiresIn: "5m", // 5 minutes
        })

        return { hashedOTP, otp }
    }
}
