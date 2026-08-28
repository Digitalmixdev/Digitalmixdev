'use client'

import Link from "next/link"
import {
  Wrench,
  Instagram,
  Linkedin,
  Mail,
  Github,
} from "lucide-react"
import { popularSearches } from "@/constants/tools"
import { useLanguage } from "@/lib/i18n/context"

const socialLinks = [
  { name: "GitHub", icon: Github, href: "https://github.com/Digitalmixdev" },
  { name: "Instagram", icon: Instagram, href: "https://www.instagram.com/digitalmixdev/" },
  { name: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com/company/digitalmixdev/" },
  {
    name: "Email",
    icon: Mail,
    href: "https://mail.google.com/mail/?view=cm&fs=1&to=digitalmixcontact@gmail.com"
  },
]

export function Footer() {
  const { t } = useLanguage()

  const legalLinks = [
    { name: t('footer.privacy', 'Privacy Policy'), href: "/privacy-policy" },
    { name: t('footer.terms', 'Terms of Service'), href: "/terms" },
  ]

  return (
    <footer className="border-t border-border/40 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Row: Brand + Links */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">

            {/* Brand Section - Left Side (5 Columns) */}
            <div className="lg:col-span-5">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Wrench className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xl font-bold tracking-tight text-foreground">
                  DigitalMix
                </span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {t('footer.description', 'Free, privacy-focused digital utilities designed to streamline your data and dev workflow.')}
              </p>
            </div>

            {/* Links Columns - Right Side (7 Columns) */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 gap-8 sm:gap-12 lg:justify-end lg:flex lg:gap-20">
              
                {/* 1. Company Column */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">{t('footer.company', 'Company')}</h3>
                  <ul className="mt-4 space-y-3">
                    <li>
                      <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {t('footer.about_us', 'About Us')}
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {t('footer.read_blog', 'Read Our Blog')}
                      </Link>
                    </li>
                    <li>
                      <Link href="/tools" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        {t('footer.tools_directory', 'Tools Directory')}
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* 2. Tools Column */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">{t('footer.popular_tools', 'Popular Tools')}</h3>
                  <ul className="mt-4 space-y-3">
                    {popularSearches.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Legal Column */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">{t('footer.legal', 'Legal')}</h3>
                  <ul className="mt-4 space-y-3">
                    {legalLinks.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>

          </div>
        </div>
        
        {/* Bottom Bar with subtle divider */}
        <div className="border-t border-border/30 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            
            {/* Text Group - Left */}
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} DigitalMix. {t('footer.all_rights', 'All rights reserved.')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('footer.made_in', 'Made In Egypt')}
              </p>
            </div>

            {/* Social Icons - Right */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-primary transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-4.5 w-4.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}