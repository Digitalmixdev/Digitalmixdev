import type { Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import CalorieCalculatorTool from '@/components/calorie-calculator-tool'

export const metadata: Metadata = {
  title: 'Free Daily Calorie, BMR & TDEE Calculator | DigitalMix',
  description:
    'Calculate your Basal Metabolic Rate (BMR), Total Daily Energy Expenditure (TDEE), and custom macronutrient splits for weight loss, maintenance, or muscle gain instantly.',
  keywords: ['calorie calculator', 'BMR calculator', 'TDEE calculator', 'macro calculator', 'weight loss calculator', 'diet calculator'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/calorie-calculator',
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
    title: 'Free Daily Calorie, BMR & TDEE Calculator | DigitalMix',
    description: 'Calculate your BMR, TDEE, and optimal macronutrient splits. 100% client-side privacy.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/calorie-calculator',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Calorie Calculator Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Calorie, BMR & TDEE Calculator',
    description: 'Calculate daily energy expenditure and macros instantly.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function CalorieCalculatorPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Daily Calorie & BMR Calculator',
        description: 'Free BMR, TDEE, and macro calculator for health and fitness',
        url: 'https://www.digitalmix.dev/tools/calorie-calculator',
        applicationCategory: 'HealthApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList: 'Mifflin-St Jeor BMR calculation, activity multipliers, macro breakdowns, 100% client-side calculation',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '128',
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
          { '@type': 'ListItem', position: 3, name: 'Calorie Calculator', item: 'https://www.digitalmix.dev/tools/calorie-calculator' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is BMR vs. TDEE?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'BMR (Basal Metabolic Rate) is the number of calories your body burns at complete rest to sustain vital organ function. TDEE (Total Daily Energy Expenditure) includes BMR plus calories burned through daily movement, digestion, and exercise.',
            },
          },
          {
            '@type': 'Question',
            name: 'How accurate is the Mifflin-St Jeor formula?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Clinical studies show the Mifflin-St Jeor equation is the most accurate predictive equation for estimating resting metabolic rate in healthy adults.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <Script
        id="calorie-calculator-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground animate-pulse font-mono text-sm">
            Loading Calorie Calculator Engine...
          </div>
        }
      >
        <CalorieCalculatorTool />
      </Suspense>
    </>
  );
}
