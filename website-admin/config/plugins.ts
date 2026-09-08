export default ({ env }) => ({
    upload: {
        config: {
            sizeLimit: 10 * 1024 * 1024, // 10MB
            // CRITICAL: Completely disable Sharp to prevent Windows file locking
            breakpoints: {},
            // Disable responsive images
            responsiveDimensions: false,
            // Disable all image optimization
            formats: [],
            provider: 'aws-s3',
            providerOptions: {
                baseUrl: env('AWS_BASE_URL'),
                s3Options: {
                    credentials: {
                        accessKeyId: env('AWS_ACCESS_KEY_ID'),
                        secretAccessKey: env('AWS_ACCESS_SECRET'),
                    },
                    region: env('AWS_REGION'),
                    endpoint: env('AWS_ENDPOINT'),
                    forcePathStyle: true,
                    params: {
                        Bucket: env('AWS_BUCKET'),
                    },
                },
            },
            actionOptions: {
                upload: {},
                uploadStream: {},
                delete: {},
            },
        },
    },
});
