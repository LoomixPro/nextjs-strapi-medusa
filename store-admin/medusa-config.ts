import { loadEnv, defineConfig, Modules, ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  resolveAdminCors,
  resolveAuthCors,
  resolveStoreCors,
} from './src/utils/resolve-cors'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const stripeApiKey =
  process.env.STRIPE_KEY || process.env.STRIPE_API_KEY

const allowHttpCookies =
  process.env.MEDUSA_ALLOW_HTTP_COOKIES === "true"

module.exports = defineConfig({

  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // توصیه مستندات رسمی Docker: غیرفعال کردن SSL برای اتصال به PostgreSQL در Docker
    databaseDriverOptions: {
      ssl: false,
      sslmode: "disable",
    },
    // توصیه مستندات رسمی Docker: تنظیم Redis در projectConfig
    redisUrl: process.env.REDIS_URL,
    ...(allowHttpCookies
      ? {
          cookieOptions: {
            secure: false,
            sameSite: "lax" as const,
          },
        }
      : {}),
    http: {
      storeCors: resolveStoreCors(),
      adminCors: resolveAdminCors(),
      authCors: resolveAuthCors(),
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
      authMethodsPerActor: {
        user: ["emailpass"],
        customer: ["emailpass", "phone-auth", "email-otp", "google"],
      },
    }
  },
  modules: [
    {
      resolve: "@medusajs/auth",
      dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER, Modules.EVENT_BUS],
      options: {
        mfa: {
          encryption_key: process.env.AUTH_MFA_ENCRYPTION_KEY,
        },
        providers: [
          {
            resolve: "@medusajs/auth-emailpass",
            id: "emailpass",
          },
          {
            resolve: "./src/modules/auth/providers/otp",
            id: "phone-auth",
            options: {
              jwtSecret: process.env.JWT_SECRET || "supersecret",
            },
          },
          {
            resolve: "./src/modules/auth/providers/email-otp",
            id: "email-otp",
            options: {
              jwtSecret: process.env.JWT_SECRET || "supersecret",
            },
          },
          {
            resolve: "@medusajs/medusa/auth-google",
            id: "google",
            options: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              callbackUrl: process.env.GOOGLE_CALLBACK_URL,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@perseidesjs/notification-nodemailer/providers/nodemailer",
            id: "nodemailer",
            options: {
              channels: ["email"],
              from: process.env.SMTP_FROM_ADDRESS,
              host: process.env.SMTP_HOST,
              port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
              secure: process.env.SMTP_SECURE === 'true',
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
              connectionTimeout: 3000, // 3 seconds timeout
              greetingTimeout: 2000, // 2 seconds timeout
            },
          },
          ...(process.env.SMS_PROVIDER === "sms-ir"
            ? [
                {
                  resolve: "./src/modules/sms-ir",
                  id: "sms-ir",
                  options: {
                    channels: ["sms"],
                    apiKey: process.env.SMS_API_KEY,
                    otpTemplateId: process.env.SMS_OTP_TEMPLATE_ID,
                    orderPlacedTemplateId: process.env.SMS_ORDER_PLACED_TEMPLATE_ID,
                    orderReadyTemplateId: process.env.SMS_ORDER_READY_TEMPLATE_ID,
                    orderShippedTemplateId: process.env.SMS_ORDER_SHIPPED_TEMPLATE_ID,
                    orderCanceledTemplateId: process.env.SMS_ORDER_CANCELED_TEMPLATE_ID,
                    refundCreatedTemplateId: process.env.SMS_REFUND_CREATED_TEMPLATE_ID,
                    returnRequestedTemplateId: process.env.SMS_RETURN_REQUESTED_TEMPLATE_ID,
                    returnReceivedTemplateId: process.env.SMS_RETURN_RECEIVED_TEMPLATE_ID,
                  },
                },
              ]
            : []),
          ...(process.env.SMS_PROVIDER === "twilio"
            ? [
                {
                  resolve: "./src/modules/sms-twilio",
                  id: "sms-twilio",
                  options: {
                    channels: ["sms"],
                    accountSid: process.env.TWILIO_ACCOUNT_SID,
                    authToken: process.env.TWILIO_AUTH_TOKEN,
                    fromNumber: process.env.TWILIO_FROM_NUMBER,
                  },
                },
              ]
            : []),
          {
            resolve: "@medusajs/medusa/notification-local",
            id: "local",
            options: {
              channels: ["feed", "log", "app"],
            },
          },
        ],
      },
    },

    {
      resolve: "./src/modules/strapi",
      options: {
        apiUrl: process.env.STRAPI_API_URL || "http://strapi:1337/api",
        apiToken: process.env.STRAPI_API_TOKEN || "",
        defaultLocale: process.env.STRAPI_DEFAULT_LOCALE || "en-US",
      },
    },

    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "./src/modules/wishlist",
      options: {},
    },
    {
      resolve: "./src/modules/product-review",
    },
    {
      resolve: "./src/modules/product-question",
    },
    {
      resolve: "./src/modules/meilisearch",
      options: {
        host: process.env.MEILISEARCH_HOST!,
        apiKey: process.env.MEILISEARCH_API_KEY!,
        productIndexName: process.env.MEILISEARCH_PRODUCT_INDEX_NAME!,
      },
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-s3",
            id: "s3",
            options: {
              file_url: process.env.S3_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION,
              bucket: process.env.S3_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
              additional_client_config: {
                forcePathStyle: true,
              },
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/translation",
      options: {
        enable_ui: true,
      },
    },
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/fulfillment-manual",
            id: "manual",
          },
          {
            resolve: "medusa-fulfillment-iran-post",
            id: "iran-post",
            options: {
              originProvince: "isfahan",
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/payment",
      options: {
        providers: [
          ...(stripeApiKey
            ? [
                {
                  resolve: "@medusajs/payment-stripe",
                  id: "stripe",
                  options: {
                    apiKey: stripeApiKey,
                    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
                  },
                },
              ]
            : []),
        ],
      },
    },
  ],
  featureFlags: {
    caching: true,
    translation: true,
  },
})
