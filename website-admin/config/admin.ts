export default ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    sessions: {
      // Maximum refresh token lifespan (30 days)
      maxRefreshTokenLifespan: 30 * 24 * 60 * 60 * 1000,
      // Maximum session lifespan (7 days)
      maxSessionLifespan: 7 * 24 * 60 * 60 * 1000,
    },
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
  preview: {
    enabled: true,
    config: {
      // Only allow previews from the Next.js frontend
      allowedOrigins: env('NEXT_PUBLIC_BASE_URL', 'http://localhost:8000'),
      // Single handler function receives uid + context — route based on uid
      handler: async (uid, { documentId, locale, status }) => {
        const clientUrl = env('NEXT_PUBLIC_BASE_URL', 'http://localhost:8000');
        const secret = env('REVALIDATE_SECRET');

        // Build the Next.js /api/preview URL with all required params
        // Next.js will validate the secret, enable Draft Mode, then redirect
        return `${clientUrl}/api/preview?secret=${secret}&uid=${uid}&documentId=${documentId}&locale=${locale}&status=${status}`;
      },
    },
  },
});
