'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@next/third-parties/google'

export function LazyThirdPartyScripts() {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    let idleCallbackId: number | null = null
    let timerId: NodeJS.Timeout | null = null

    timerId = setTimeout(() => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        idleCallbackId = window.requestIdleCallback(() => {
          setShouldLoad(true)
        })
      } else {
        setShouldLoad(true)
      }
    }, 3000)

    return () => {
      if (timerId) clearTimeout(timerId)
      if (idleCallbackId !== null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackId)
      }
    }
  }, [])

  if (!shouldLoad) return null

  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID

  return (
    <>
      {/* Vercel Analytics */}
      {process.env.NODE_ENV === 'production' && <Analytics />}

      {/* Google Analytics */}
      {gaId && <GoogleAnalytics gaId={gaId} />}

      {/* Google AdSense */}
      <Script
        id="google-adsense"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5995253364983936"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      {/* Microsoft Clarity Analytics */}
      {clarityId && (
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
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
