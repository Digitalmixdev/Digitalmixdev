import { Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import KpiCalculatorTool from '@/components/kpi-calculator-tool'

export const metadata: Metadata = {
  title: 'KPI Calculator Suite: Advanced ROI, CAC/LTV & Profit Margins',
  description: 'Instantly calculate SaaS KPIs, CAC, ROI, and corporate Gross Profit Margins locally on your browser thread.',
  keywords: ['kpi calculator', 'saas kpis', 'roi calculator', 'cac ltv calculator', 'profit margin calculator', 'developer tools'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/kpi-calculator',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },  
  openGraph: {
    title: 'KPI Calculator Suite: Advanced ROI & SaaS Metrics | DigitalMix',
    description: 'Calculate SaaS KPIs, CAC, ROI, and Profit Margins instantly and locally on your browser thread with absolute privacy.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/kpi-calculator',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KPI Calculator Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free KPI & SaaS Metrics Calculator',
    description: 'Calculate ROI, CAC, LTV, and profit margins instantly. 100% client-side.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function KpiCalculatorPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'KPI Calculator',
        description: 'Advanced calculator for SaaS KPIs, ROI, CAC, LTV, and profit margins',
        url: 'https://www.digitalmix.dev/tools/kpi-calculator',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList: 'Automated business metrics calculation, supports profit margin ROI and conversion rates, instant accurate visual results, responsive calculator layout',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '95',
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.digitalmix.dev' },
          { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://www.digitalmix.dev/tools/calculators' },
          { '@type': 'ListItem', position: 3, name: 'KPI Calculator', item: 'https://www.digitalmix.dev/tools/kpi-calculator' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What KPIs can I calculate?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'You can calculate ROI, CAC (Customer Acquisition Cost), LTV (Lifetime Value), profit margins, and other SaaS metrics.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is the calculator accurate for my business?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, the calculator uses standard business formulas. Results are only as accurate as the input data you provide.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I save my calculations?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Calculations are performed locally in your browser. You can screenshot or note the results as needed.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <Script
        id="kpi-calculator-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground animate-pulse font-mono text-sm">
          Loading DigitalMix Calculator Framework...
        </div>
      }>
        <KpiCalculatorTool />
      </Suspense>
    </>
  );
}
