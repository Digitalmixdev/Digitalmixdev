'use client'

import React from 'react'
import { Scale, CheckCircle2, ShieldAlert, Shield, Users } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

export function TermsClient() {
  const { language } = useLanguage()
  const isArabic = language === 'ar'

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-3 border-b border-border/60 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
          <Scale size={14} />
          <span>{isArabic ? 'الاتفاقية القانونية وشروط الاستخدام' : 'Legal & Usage Agreement'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {isArabic ? 'شروط الخدمة والاستخدام' : 'Terms of Service'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isArabic ? 'آخر تحديث: أغسطس 2026' : 'Last Updated: August 2026'}
        </p>
      </div>

      {/* Terms Content */}
      <div className="space-y-6 text-muted-foreground leading-relaxed text-sm sm:text-base">
        {/* 1. Acceptance */}
        <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
            <Scale size={22} className="text-primary" />
            <span>{isArabic ? '1. الموافقة على الشروط' : '1. Acceptance of Terms'}</span>
          </h2>
          <p>
            {isArabic
              ? 'باستخدامك أو وصولك أو تصفحك لأي من الأدوات والخدمات التي تقدمها منصة ديجيتال ميكس (DigitalMix)، فإنك تقر وتوافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى التوقف عن استخدام الموقع فوراً.'
              : 'By accessing, browsing, or using any tools provided by DigitalMix, you acknowledge and agree to be bound by these Terms of Service. If you disagree with any part of these terms, you must discontinue using our website and services immediately.'}
          </p>
        </section>

        {/* 2. Free Commercial & Personal License */}
        <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
            <CheckCircle2 size={22} className="text-emerald-500" />
            <span>
              {isArabic
                ? '2. ترخيص الاستخدام العادل والمجاني التجاري والشخصي'
                : '2. Fair & Free Commercial / Personal License'}
            </span>
          </h2>
          <p>
            {isArabic
              ? 'جميع الأدوات والمحولات والحاسبات ومنسقات الأكواد المتاحة على ديجيتال ميكس مقدمة مجاناً بنسبة 100% للاستخدام الشخصي والتجاري والتعليمي والمؤسسي. تحتفظ بكامل الملكية الحصرية لجميع ملفاتك، مستنداتك، استعلاماتك، صورك، وبياناتك التي تتم معالجتها عبر أدواتنا.'
              : 'All utilities, converters, calculators, and formatters on DigitalMix are provided 100% free of charge for both personal, commercial, and enterprise workflows. You retain complete, unrestricted ownership of all code, documents, queries, images, and data processed through our tools.'}
          </p>
        </section>

        {/* 3. User Accounts */}
        <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
            <Users size={22} className="text-blue-500" />
            <span>{isArabic ? '3. حسابات المستخدمين وأمان الحساب' : '3. User Accounts & Security'}</span>
          </h2>
          <p>
            {isArabic
              ? 'أنت مسؤول عن الحفاظ على سرية بيانات تسجيل الدخول لحسابك وعن أي أنشطة تتم من خلاله. وتتعهد بعدم استخدام المنصة لأي أغراض غير قانونية أو محاولات إضرار بأمان واستقرار الموقع.'
              : 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree not to use the platform for any unlawful activities, malicious reverse engineering, or intentional attempts to disrupt service availability.'}
          </p>
        </section>

        {/* 4. Local Processing */}
        <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
            <Shield size={22} className="text-indigo-500" />
            <span>{isArabic ? '4. المعالجة المحلية ومسؤولية النسخ الاحتياطي' : '4. Local Processing & Zero Liability'}</span>
          </h2>
          <p>
            {isArabic
              ? 'نظراً لأن جميع عمليات تحويل الملفات وتنسيق الأكواد تجري مباشرة داخل متصفح جهازك ولا ترسل إلى سيرفراتنا، فإن المنصة لا تحتفظ بنسخ احتياطية من ملفاتك. أنت المسؤول الوحيد عن الاحتفاظ بنسخ احتياطية لمستنداتك وأكوادك الهامة.'
              : 'Because file conversions and calculations take place directly inside your web browser, DigitalMix does not store, backup, or maintain copies of your inputs. You are solely responsible for keeping independent backups of your important documents, codebases, and assets.'}
          </p>
        </section>

        {/* 5. Warranty Disclaimer */}
        <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
            <ShieldAlert size={22} className="text-amber-500" />
            <span>{isArabic ? '5. إخلاء المسؤولية والضمانات' : '5. Disclaimer of Warranties'}</span>
          </h2>
          <p>
            {isArabic
              ? 'يتم تقديم خدمات ديجيتال ميكس على أساس "كما هي" و "حسب التوفر" دون أي ضمانات صريحة أو ضمنية. على الرغم من فحص واختبار خوارزمياتنا بدقة عالية لضمان صحة المخرجات، إلا أن المستخدم يظل مسؤولاً عن مراجعة النتائج قبل اعتمادها في البيئات الإنتاجية الحرجة.'
              : 'DigitalMix is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. While our algorithms undergo continuous verification for precision and compliance, we do not guarantee uninterrupted availability or error-free outputs for mission-critical production operations without your independent validation.'}
          </p>
        </section>
      </div>
    </div>
  )
}
