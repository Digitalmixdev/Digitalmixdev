'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'

export function LazyThirdPartyScripts() {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null

    const triggerLoad = () => {
      setShouldLoad(true)
      cleanup()
    }

    const events = ['scroll', 'pointermove', 'touchstart', 'keydown', 'click']

    const handleUserActivity = () => {
      triggerLoad()
    }

    const cleanup = () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity, { capture: true })
      })
      if (timerId) clearTimeout(timerId)
    }

    // Attach listeners for user interaction
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { capture: true, once: true, passive: true })
    })

    // Fallback: load after 8 seconds if no interaction occurs
    timerId = setTimeout(triggerLoad, 8000)

    return cleanup
  }, [])

  if (!shouldLoad) return null

  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID

  return (
    <>
      {/* Vercel Analytics */}
      {process.env.NODE_ENV === 'production' && <Analytics />}

      {/* Google Analytics - Privacy First (No 3rd-party cookies/signals) */}
      {gaId && (
        <>
          <Script
            id="google-analytics-tag"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="lazyOnload"
          />
          <Script
            id="google-analytics-config"
            strategy="lazyOnload"
          >
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', {
                'anonymize_ip': true,
                'allow_google_signals': false,
                'allow_ad_personalization_signals': false,
                'cookie_flags': 'SameSite=None;Secure',
                'restricted_data_processing': true
              });
            `}
          </Script>
        </>
      )}

      {/* Google AdSense */}
      <Script
        id="google-adsense"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5995253364983936"
        crossOrigin="anonymous"
        strategy="lazyOnload"
      />

      {/* Microsoft Clarity Analytics - Cookie-lean mode */}
      {clarityId && (
        <Script
          id="microsoft-clarity"
          strategy="lazyOnload"
          suppressHydrationWarning
        >
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarityId}");
          `}
        </Script>
      )}
    </>
  )
}


