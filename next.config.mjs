/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        // Prevent MIME type sniffing
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        // Prevent clickjacking attacks
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        // Enable XSS protection in older browsers
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        // Control referrer information
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        // Encourage HTTPS
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
        // Content Security Policy for required third-party scripts
        {
          key: 'Content-Security-Policy',
          value: 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.clarity.ms https://scripts.clarity.ms https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https: blob:; " +
            "font-src 'self' data: https:; " +
            "connect-src 'self' https://*.clarity.ms https: wss:; " +
            "frame-src 'self' https://challenges.cloudflare.com https://www.google.com; " +
            "worker-src 'self' blob:; " +
            "object-src 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self'",
        },
      ],
    },
  ],
}

export default nextConfig
