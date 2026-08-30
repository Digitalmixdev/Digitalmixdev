/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  redirects: async () => [
    {
      source: '/tools/roi-calculator',
      destination: '/tools/kpi-calculator?tab=roi',
      permanent: false,
    },
    {
      source: '/tools/profit-calculator',
      destination: '/tools/kpi-calculator?tab=profit',
      permanent: false,
    },
  ],
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        // Prevent MIME type sniffing
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
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
        // Cross-Origin-Opener-Policy for origin isolation
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin-allow-popups',
        },
        // Permissions-Policy (allow camera for QR & Barcode scanner tool)
        {
          key: 'Permissions-Policy',
          value: 'camera=(self), microphone=(), geolocation=()',
        },
        // Encourage HTTPS
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        // Explicitly allow indexing for search engines & Lighthouse
        {
          key: 'X-Robots-Tag',
          value: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
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
