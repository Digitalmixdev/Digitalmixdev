'use client'

import React from 'react'
import { ShieldCheck, EyeOff, ServerOff, UserCheck, Trash2, History } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

export function PrivacyClient() {
  const { language } = useLanguage()
  const isArabic = language === 'ar'

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-3 border-b border-border/60 pb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <ShieldCheck size={14} />
          <span>{isArabic ? 'خصوصية البيانات والأمان' : 'Comprehensive Data Privacy'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {isArabic ? 'سياسة الخصوصية وأمان البيانات' : 'Privacy Policy & Data Security'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isArabic ? 'آخر تحديث ومراجعة: أغسطس 2026' : 'Last Updated & Reviewed: August 2026'}
        </p>
      </div>

      {/* Core Privacy Highlight */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row gap-5 items-start shadow-xs">
        <div className="p-3 bg-emerald-500/20 rounded-xl shrink-0 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-lg">
            {isArabic
              ? 'ضمان المعالجة المحلية الكاملة وعدم رفع الملفات'
              : 'Our Absolute Client-Side & Zero-Upload Guarantee'}
          </h3>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            {isArabic ? (
              <>
                تم تصميم وبناء منصة <strong>ديجيتال ميكس (DigitalMix)</strong> بهيكلية صارمة تعتمد بنسبة{' '}
                <strong>100% على المعالجة المحلية داخل متصفحك (Client-Side)</strong> دون الاعتماد على خوادم سحابية خارجية.
                جميع عمليات تحويل وتعديل الملفات (Word, Excel, PowerPoint, PDF, Images)، وتنسيق وفحص الأكواد (SQL, JSON)، وقراءة
                وتوليد الباركود وQR، والتشفير الرقمي، والحسابات تتم{' '}
                <strong>بالكامل داخل متصفح جهازك</strong>. ملفاتك ومدخلاتك الحساسة{' '}
                <strong>لا يتم نقلها أو حفظها أو فحصها على خوادمنا نهائياً</strong>.
              </>
            ) : (
              <>
                DigitalMix is engineered with a strict <strong>zero-cloud-dependency & client-side</strong> architecture.
                All file conversions (Word, Excel, PowerPoint, PDF, Images), code beautification (SQL, JSON), barcode/QR
                scanning, cryptographic hashing, and calculations occur <strong>100% inside your local web browser</strong>.
                Your raw files and sensitive payloads are <strong>never transmitted to, stored on, or inspected by our servers</strong>.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Policy Sections */}
      <div className="space-y-6 text-muted-foreground leading-relaxed text-sm sm:text-base">
        {/* 1. Client-Side Processing */}
        <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
            <ServerOff size={22} className="text-primary" />
            <span>
              {isArabic ? '1. عدم وجود معالجة للملفات على الخوادم' : '1. Zero Server-Side File Processing'}
            </span>
          </h2>
          <p>
            {isArabic ? (
              <>
                عند رفع أي مستند أو ملف (مثل <code>.docx</code>, <code>.pptx</code>, <code>.xlsx</code>,{' '}
                <code>.pdf</code>, <code>.png</code>, <code>.jpg</code>, <code>.svg</code>)، يتم تشغيل مسار التحويل والعرض
                بالكامل عبر تقنيات المتصفح الحديثة (WebAssembly و HTML5 Canvas وكود JavaScript المحلي). نحن لا ندير خوادم
                تستقبل أو تنسخ أو تحتفظ بملفاتك إطلاقاً.
              </>
            ) : (
              <>
                When you upload a document (such as <code>.docx</code>, <code>.pptx</code>, <code>.xlsx</code>,{' '}
                <code>.pdf</code>, <code>.png</code>, <code>.jpg</code>, <code>.svg</code>), the entire conversion and
                rendering pipeline runs purely through browser technologies (WebAssembly, HTML5 Canvas, and client-side
                JavaScript). We do not operate backend servers that receive, copy, or retain your files.
              </>
            )}
          </p>
        </section>

        {/* 2. Activity History & Local Storage */}
        <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
            <History size={22} className="text-blue-500" />
            <span>
              {isArabic ? '2. سجل النشاطات وتحكم المستخدم الكامل' : '2. Activity History & User Control'}
            </span>
          </h2>
          <p>
            {isArabic ? (
              <>
                لتعزيز إنتاجيتك وسرعة استرجاع أعمالك، يحتفظ ديجيتال ميكس بنشاطاتك الأخيرة (مثل استعلامات SQL و JSON المنسقة،
                ورموز QR المنشأة، وملخصات التحويل) داخل <strong>التخزين المحلي لمتصفحك (localStorage)</strong>.
              </>
            ) : (
              <>
                To enhance your productivity, DigitalMix records your recent tool activities (such as formatted SQL/JSON
                queries, generated QR codes, and conversion summaries) in your browser’s{' '}
                <strong>Local Storage (localStorage)</strong>.
              </>
            )}
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-foreground/90">
            <li>
              <strong>{isArabic ? 'حذف عنصر منفرد:' : 'Individual Deletion:'}</strong>{' '}
              {isArabic
                ? 'يمكنك حذف أي عنصر بمفرده من سجل الأداة أو لوحة التحكم في أي وقت.'
                : 'You can delete any single item from the tool history or dashboard at any moment.'}
            </li>
            <li>
              <strong>{isArabic ? 'مسح كل السجل:' : 'Clear All History:'}</strong>{' '}
              {isArabic
                ? 'يمكنك محو كامل سجل النشاطات بضغطة زر واحدة من لوحة التحكم أو داخل الأدوات.'
                : 'You can purge your entire activity history with a single click in the Dashboard or within individual tools.'}
            </li>
            <li>
              <strong>{isArabic ? 'تصدير البيانات:' : 'Data Export:'}</strong>{' '}
              {isArabic
                ? 'يحق لك تنزيل وتصدير سجل نشاطاتك كملف JSON أو CSV نظيف لنسخك الاحتياطي الخاص.'
                : 'You have full rights to export your activity logs as clean JSON or CSV files for your personal backup.'}
            </li>
          </ul>
        </section>

        {/* 3. Account Data & Authentication */}
        <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
            <UserCheck size={22} className="text-emerald-500" />
            <span>
              {isArabic ? '3. حسابات المستخدمين وبيانات الاعتماد' : '3. User Accounts & Credentials'}
            </span>
          </h2>
          <p>
            {isArabic
              ? 'إنشاء حساب على منصة ديجيتال ميكس اختياري بالكامل. إذا اخترت تسجيل حساب:'
              : 'Creating an account on DigitalMix is entirely optional. If you choose to register an account:'}
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-foreground/90">
            <li>
              {isArabic
                ? 'نقوم بحفظ معلومات ملفك الشخصي الأساسية (الاسم، البريد الإلكتروني) وتشفير كلمة المرور بأقوى معايير التشفير الصناعية (bcrypt/argon2).'
                : 'We securely store your basic profile information (Name, Email) and encrypted password hashes using industry-standard hashing algorithms (bcrypt/argon2).'}
            </li>
            <li>
              {isArabic
                ? 'تُستخدم بياناتك فقط للمصادقة على جلساتك ومزامنة أدواتك المفضلة وتفضيلاتك بين أجهزتك المختلفة.'
                : 'Your credentials are used solely to authenticate your sessions and synchronize your tool preferences/favorites across devices.'}
            </li>
            <li>
              {isArabic
                ? 'نحن لا نبيع أو نؤجر أو نشارك أي بيانات للمستخدمين مع أي جهات خارجية أو شركات إعلانية على الإطلاق.'
                : 'We do not sell, rent, or trade user account information with any third parties or advertisers.'}
            </li>
          </ul>
        </section>

        {/* 4. Cookies & Anonymous Analytics */}
        <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
            <EyeOff size={22} className="text-amber-500" />
            <span>
              {isArabic ? '4. ملفات تعريف الارتباط والإحصائيات المجهولة' : '4. Cookies & Anonymous Analytics'}
            </span>
          </h2>
          <p>
            {isArabic
              ? 'نستخدم ملفات تعريف ارتباط (Cookies) آمنة فقط للحفاظ على تسجيل دخولك وحفظ تفضيلاتك (مثل الوضع الداكن/الفاتح واختيار اللغة). قد نستخدم تحليلات إحصائية مجهولة المصدر لقياس سرعة الموقع واستقراره فقط، دون جمع أي بيانات شخصية أو محتويات للملفات أو الاستعلامات.'
              : 'We use secure HTTP-only cookies strictly for session authentication and user preferences (such as light/dark mode and language selection). We may use privacy-respecting aggregate analytics to measure overall website speed, uptime, and page visits. No personal data, file contents, or query payloads are ever collected through analytics.'}
          </p>
        </section>

        {/* 5. User Rights & Data Erasure */}
        <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
            <Trash2 size={22} className="text-destructive" />
            <span>
              {isArabic ? '5. حق الحذف والامتثال لمعايير GDPR و CCPA' : '5. Right to Erasure (GDPR & CCPA Compliance)'}
            </span>
          </h2>
          <p>
            {isArabic
              ? 'بموجب قوانين حماية البيانات والخصوصية العالمية (بما فيها GDPR و CCPA)، تتمتع بالملكية الكاملة لبياناتك. يمكنك في أي وقت حذف حسابك وكافة سجلاتك نهائياً من صفحة الإعدادات (Settings)، أو مسح ذاكرة التخزين في متصفحك لإزالة كل أثر فوري.'
              : 'Under global privacy laws (including GDPR and CCPA), you hold full ownership of your data. You may at any time delete your account and all associated records directly from your Settings page, or purge your browser storage to remove all traces immediately.'}
          </p>
        </section>
      </div>
    </div>
  )
}
