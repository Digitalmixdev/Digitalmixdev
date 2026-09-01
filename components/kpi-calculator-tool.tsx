'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Calculator,
  TrendingUp,
  DollarSign,
  Users,
  Percent,
  Calendar,
  Sparkles,
  Clock,
  PieChart,
  BarChart3,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { logToolActivity } from '@/lib/history-service'
import { useLanguage } from '@/lib/i18n/context'

const toolMeta: ToolMetadata = {
  id: 'kpi-calculator',
  name: 'KPI & Business Metrics Calculator Suite',
  name_ar: 'حاسبة المؤشرات المالية والتجارية (ROI, CAC, LTV, Profit)',
  description:
    'Calculate Return on Investment (ROI), Customer Acquisition Cost (CAC), Lifetime Value (LTV), and Profit Margins locally on your browser.',
  description_ar:
    'حساب العائد على الاستثمار (ROI)، تكلفة الاستحواذ على العميل (CAC)، القيمة الدائمة للعميل (LTV)، وهامش الربح محلياً وبسرعة فائقة.',
  category: {
    id: 'calculators',
    name: 'Business Calculators',
    slug: 'calculators',
  },
  icon: Calculator,
  privacyBadge: '100% Client-Side • Institutional Math Precision',
  privacyBadge_ar: '100% معالجة داخل متصفحك • دقة حسابية عالية',
  features: [
    {
      icon: TrendingUp,
      title: 'Time-Weighted ROI Engine',
      desc: 'Computes compounded annualized yield rates based on exact calendar date deltas.',
    },
    {
      icon: Users,
      title: 'SaaS Unit Economics',
      desc: 'Benchmarks LTV:CAC ratios against venture health standards with payback models.',
    },
    {
      icon: DollarSign,
      title: 'Dual Margin & Markup',
      desc: 'Calculates gross profit margins alongside markup multipliers to prevent pricing errors.',
    },
    {
      icon: ShieldCheck,
      title: 'Confidential Ledger Security',
      desc: 'Your company financial numbers and corporate data never leave your browser.',
    },
  ],
  features_ar: [
    {
      icon: TrendingUp,
      title: 'حاسبة العائد السنوي المرجح بالوقت',
      desc: 'حساب معدل النمو السنوي المركب بناءً على فرق التواريخ الدقيق.',
    },
    {
      icon: Users,
      title: 'مؤشرات اقتصاديات الوحدات لـ SaaS',
      desc: 'قياس نسبة LTV:CAC مقارنة بالمعايير العالمية وفترة استرداد التكاليف.',
    },
    {
      icon: DollarSign,
      title: 'حساب مزدوج للهامش ونسبة الإضافة',
      desc: 'حساب مجمل هامش الربح ونسبة الإضافة على التكلفة لتفادي أخطاء التسعير.',
    },
    {
      icon: ShieldCheck,
      title: 'أمان وسرية البيانات المالية',
      desc: 'جميع أرقام وبيانات شركتك المالية لا تغادر جهازك أبداً.',
    },
  ],
  faqs: [
    {
      q: 'What is the difference between Total ROI and Annualized ROI?',
      a: 'Total ROI shows absolute yield regardless of duration. Annualized ROI calculates the geometric compound annual growth rate (CAGR), enabling fair comparison across investments of varying lengths.',
    },
    {
      q: 'What is a healthy SaaS LTV to CAC ratio?',
      a: 'An optimal benchmark for scalable SaaS businesses is 3.0x to 5.0x. A ratio below 1.0x indicates unsustainable acquisition costs, while above 5.0x indicates potential underinvestment in marketing.',
    },
    {
      q: 'How does Profit Margin differ from Markup?',
      a: 'Profit Margin is the percentage of revenue that is gross profit (Profit / Revenue). Markup is the percentage added onto the original cost of goods (Profit / Cost). Margin is always lower than Markup.',
    },
  ],
  faqs_ar: [
    {
      q: 'ما الفرق بين إجمالي العائد على الاستثمار (Total ROI) والعائد السنوي (Annualized ROI)؟',
      a: 'إجمالي العائد يوضح النسبة الكلية للربح بغض النظر عن المدة الزمنية، بينما العائد السنوي يحسب معدل النمو السنوي المركب (CAGR) لمقارنة الاستثمارات مختلفة الآجال.',
    },
    {
      q: 'ما هي النسبة الصحية لمؤشر LTV إلى CAC في شركات SaaS؟',
      a: 'المعيار النموذجي لشركات SaaS القابلة للتوسع هو بين 3.0x إلى 5.0x. أي نسبة أقل من 1.0x تعني تكاليف استحواذ غير مستدامة، بينما النسبة الأعلى من 5.0x تعني إمكانية زيادة الاستثمار في التسويق.',
    },
    {
      q: 'ما الفرق بين هامش الربح (Profit Margin) ونسبة الإضافة (Markup)؟',
      a: 'هامش الربح هو نسبة مجمل الربح إلى إجمالي الإيرادات (الربح ÷ الإيرادات). أما نسبة الإضافة فهي النسبة المضافة فوق تكلفة البضاعة المباعة (الربح ÷ التكلفة). الهامش دائماً أقل من نسبة الإضافة.',
    },
  ],
}

function formatCurrency(val: number): string {
  if (!isFinite(val) || isNaN(val)) return '$0.00'
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatPercent(val: number): string {
  if (!isFinite(val) || isNaN(val)) return '0.00%'
  return `${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

// 1. ROI CALCULATOR ENGINE
function RoiCalculatorEngine({ onCalculate }: { onCalculate: () => void }) {
  const { language } = useLanguage()
  const isArabic = language === 'ar'

  const [invested, setInvested] = useState('1200')
  const [returned, setReturned] = useState('2000')
  const [fromDate, setFromDate] = useState('2024-01-01')
  const [toDate, setToDate] = useState('2026-06-01')

  const inv = parseFloat(invested) || 0
  const ret = parseFloat(returned) || 0
  const profit = ret - inv
  const totalRoi = inv > 0 ? (profit / inv) * 100 : 0

  // Calculate annualized ROI
  const d1 = new Date(fromDate)
  const d2 = new Date(toDate)
  const days = Math.max(1, (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
  const years = days / 365.25
  const annualizedRoi =
    inv > 0 && ret > 0 && years > 0
      ? (Math.pow(ret / inv, 1 / years) - 1) * 100
      : totalRoi

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Inputs */}
      <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          {isArabic ? 'معاملات الاستثمار' : 'Investment Parameters'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {isArabic ? 'رأس المال الأولي ($)' : 'Initial Capital ($)'}
            </label>
            <input
              type="number"
              value={invested}
              onChange={(e) => {
                setInvested(e.target.value)
                onCalculate()
              }}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {isArabic ? 'العائد النهائي ($)' : 'Final Return ($)'}
            </label>
            <input
              type="number"
              value={returned}
              onChange={(e) => {
                setReturned(e.target.value)
                onCalculate()
              }}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {isArabic ? 'تاريخ البداية' : 'Start Date'}
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value)
                onCalculate()
              }}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {isArabic ? 'تاريخ النهاية' : 'End Date'}
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value)
                onCalculate()
              }}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Results Box */}
      <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          {isArabic ? 'مؤشرات العائد المحسوبة' : 'Calculated Return Metrics'}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-background border border-border text-center min-w-0">
            <span className="text-xs text-muted-foreground font-medium block">
              {isArabic ? 'صافي الربح' : 'Net Profit'}
            </span>
            <div
              className={`text-lg sm:text-xl md:text-2xl font-extrabold mt-1 break-all leading-tight ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
            >
              {profit >= 0 ? `+${formatCurrency(profit)}` : `-${formatCurrency(Math.abs(profit))}`}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border text-center min-w-0">
            <span className="text-xs text-muted-foreground font-medium block">
              {isArabic ? 'إجمالي العائد ROI' : 'Total ROI'}
            </span>
            <div
              className={`text-lg sm:text-xl md:text-2xl font-extrabold mt-1 break-all leading-tight ${totalRoi >= 0 ? 'text-primary' : 'text-rose-500'}`}
            >
              {formatPercent(totalRoi)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-background border border-border text-center min-w-0">
            <span className="text-xs text-muted-foreground font-medium block">
              {isArabic ? 'العائد السنوي المركب' : 'Annualized ROI'}
            </span>
            <div className="text-sm sm:text-base md:text-xl font-bold text-foreground mt-1 break-all leading-tight">
              {formatPercent(annualizedRoi)}{' '}
              <span className="text-xs text-muted-foreground font-normal">
                {isArabic ? '/سنة' : '/yr'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border text-center min-w-0">
            <span className="text-xs text-muted-foreground font-medium block">
              {isArabic ? 'مدة الاستثمار' : 'Holding Period'}
            </span>
            <div className="text-sm sm:text-base md:text-xl font-bold text-foreground mt-1 break-all leading-tight">
              {years.toFixed(1)}{' '}
              <span className="text-xs text-muted-foreground font-normal">
                {isArabic ? 'سنوات' : 'Years'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 2. SAAS CAC & LTV CALCULATOR ENGINE
function SaaSCacLtvCalculatorEngine({ onCalculate }: { onCalculate: () => void }) {
  const { language } = useLanguage()
  const isArabic = language === 'ar'

  const [spend, setSpend] = useState('5000')
  const [acquired, setAcquired] = useState('100')
  const [arpu, setArpu] = useState('65')
  const [churn, setChurn] = useState('5')

  const s = parseFloat(spend) || 0
  const acq = parseFloat(acquired) || 1
  const a = parseFloat(arpu) || 0
  const ch = (parseFloat(churn) || 1) / 100

  const cac = acq > 0 ? s / acq : 0
  const ltv = ch > 0 ? a / ch : 0
  const ratio = cac > 0 ? ltv / cac : 0
  const payback = a > 0 ? cac / a : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Inputs */}
      <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          {isArabic ? 'مدخلات اقتصاديات الوحدة' : 'Unit Economics Inputs'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {isArabic ? 'الإنفاق التسويقي الشهري ($)' : 'Monthly Marketing Spend ($)'}
            </label>
            <input
              type="number"
              value={spend}
              onChange={(e) => {
                setSpend(e.target.value)
                onCalculate()
              }}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {isArabic ? 'عدد العملاء الجدد' : 'New Customers Acquired'}
            </label>
            <input
              type="number"
              value={acquired}
              onChange={(e) => {
                setAcquired(e.target.value)
                onCalculate()
              }}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {isArabic ? 'متوسط الإيراد لكل عميل شهرياً ($)' : 'Monthly ARPU ($)'}
            </label>
            <input
              type="number"
              value={arpu}
              onChange={(e) => {
                setArpu(e.target.value)
                onCalculate()
              }}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {isArabic ? 'نسبة تسرب العملاء الشهرية (%)' : 'Monthly Churn Rate (%)'}
            </label>
            <input
              type="number"
              value={churn}
              onChange={(e) => {
                setChurn(e.target.value)
                onCalculate()
              }}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Outputs */}
      <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-500" />
          {isArabic ? 'مؤشرات نمو SaaS' : 'SaaS Growth Metrics'}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-background border border-border text-center min-w-0">
            <span className="text-xs text-muted-foreground font-medium block">
              {isArabic ? 'تكلفة الاستحواذ (CAC)' : 'CAC (Acquisition Cost)'}
            </span>
            <div className="text-lg sm:text-xl md:text-2xl font-extrabold text-foreground mt-1 break-all leading-tight">
              {formatCurrency(cac)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border text-center min-w-0">
            <span className="text-xs text-muted-foreground font-medium block">
              {isArabic ? 'القيمة الدائمة للعميل (LTV)' : 'LTV (Customer Value)'}
            </span>
            <div className="text-lg sm:text-xl md:text-2xl font-extrabold text-primary mt-1 break-all leading-tight">
              {formatCurrency(ltv)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-background border border-border text-center min-w-0">
            <span className="text-xs text-muted-foreground font-medium block">
              {isArabic ? 'نسبة LTV إلى CAC' : 'LTV : CAC Ratio'}
            </span>
            <div
              className={`text-lg sm:text-xl md:text-2xl font-extrabold mt-1 break-all leading-tight ${ratio >= 3 ? 'text-emerald-500' : ratio >= 1 ? 'text-amber-500' : 'text-rose-500'}`}
            >
              {isFinite(ratio) ? ratio.toFixed(2) : '0.00'}x
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border text-center min-w-0">
            <span className="text-xs text-muted-foreground font-medium block">
              {isArabic ? 'فترة استرداد التكلفة' : 'Payback Period'}
            </span>
            <div className="text-sm sm:text-base md:text-xl font-bold text-foreground mt-1 break-all leading-tight">
              {isFinite(payback) ? payback.toFixed(1) : '0.0'}{' '}
              <span className="text-xs text-muted-foreground font-normal">
                {isArabic ? 'أشهر' : 'Months'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 3. PROFIT MARGIN CALCULATOR ENGINE
function ProfitMarginCalculatorEngine({ onCalculate }: { onCalculate: () => void }) {
  const { language } = useLanguage()
  const isArabic = language === 'ar'

  const [revenue, setRevenue] = useState('10000')
  const [cogs, setCogs] = useState('6000')

  const rev = parseFloat(revenue) || 0
  const cost = parseFloat(cogs) || 0
  const grossProfit = rev - cost
  const marginPct = rev > 0 ? (grossProfit / rev) * 100 : 0
  const markupPct = cost > 0 ? (grossProfit / cost) * 100 : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Inputs */}
      <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          {isArabic ? 'معاملات التسعير والمالية' : 'Financial Pricing Parameters'}
        </h3>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {isArabic ? 'إجمالي إيراد المبيعات / السعر ($)' : 'Total Sales Revenue / Price ($)'}
            </label>
            <input
              type="number"
              value={revenue}
              onChange={(e) => {
                setRevenue(e.target.value)
                onCalculate()
              }}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {isArabic ? 'تكلفة البضاعة المباعة (COGS) ($)' : 'Cost of Goods Sold (COGS) ($)'}
            </label>
            <input
              type="number"
              value={cogs}
              onChange={(e) => {
                setCogs(e.target.value)
                onCalculate()
              }}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Outputs */}
      <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Percent className="h-4 w-4 text-emerald-500" />
          {isArabic ? 'نتائج الهامش والربحية' : 'Yield & Margin Results'}
        </h3>

        <div className="p-4 rounded-xl bg-background border border-border text-center min-w-0">
          <span className="text-xs text-muted-foreground font-medium block">
            {isArabic ? 'مجمل الربح النقدي' : 'Gross Profit Cash'}
          </span>
          <div
            className={`text-xl sm:text-2xl md:text-3xl font-extrabold mt-1 break-all leading-tight ${grossProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
          >
            {grossProfit >= 0 ? `+${formatCurrency(grossProfit)}` : `-${formatCurrency(Math.abs(grossProfit))}`}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-background border border-border text-center min-w-0">
            <span className="text-xs text-muted-foreground font-medium block">
              {isArabic ? 'هامش الربح الإجمالي' : 'Gross Margin'}
            </span>
            <div className="text-lg sm:text-xl md:text-2xl font-extrabold text-primary mt-1 break-all leading-tight">
              {formatPercent(marginPct)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background border border-border text-center min-w-0">
            <span className="text-xs text-muted-foreground font-medium block">
              {isArabic ? 'نسبة الإضافة (Markup)' : 'Markup Percentage'}
            </span>
            <div className="text-lg sm:text-xl md:text-2xl font-extrabold text-foreground mt-1 break-all leading-tight">
              {formatPercent(markupPct)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCalculatorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { language } = useLanguage()
  const isArabic = language === 'ar'

  const tabParam = searchParams.get('tab')
  const defaultTab = tabParam === 'product' ? 'product' : tabParam === 'profit' ? 'profit' : 'roi'
  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleTabChange = (val: string) => {
    setActiveTab(val)
    router.replace(`/tools/kpi-calculator?tab=${val}`, { scroll: false })
  }

  const handleCalculate = async () => {
    try {
      await Promise.all([
        incrementToolUsage(),
        markToolUsed('kpi-calculator'),
      ])
      logToolActivity({
        toolId: 'kpi-calculator',
        toolName: 'KPI & Business Metrics Calculator Suite',
        category: 'Calculators',
        actionTitle: `Calculated Business Metrics (${activeTab.toUpperCase()})`,
        details: `Ran ${activeTab.toUpperCase()} analysis calculations on business metrics suite.`,
      })
    } catch {
      // Non-blocking telemetry
    }
  }

  return (
    <ToolLayout metadata={toolMeta} maxWidth="6xl">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="grid grid-cols-3 w-full max-w-md sm:max-w-xl h-12">
            <TabsTrigger value="roi" className="gap-1.5 text-xs sm:text-sm">
              <TrendingUp className="h-4 w-4" />
              {isArabic ? 'حاسبة العائد ROI' : 'ROI Engine'}
            </TabsTrigger>
            <TabsTrigger value="product" className="gap-1.5 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              {isArabic ? 'CAC & LTV' : 'CAC & LTV'}
            </TabsTrigger>
            <TabsTrigger value="profit" className="gap-1.5 text-xs sm:text-sm">
              <DollarSign className="h-4 w-4" />
              {isArabic ? 'هامش الربح' : 'Profit Margin'}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="roi">
          <RoiCalculatorEngine onCalculate={handleCalculate} />
        </TabsContent>

        <TabsContent value="product">
          <SaaSCacLtvCalculatorEngine onCalculate={handleCalculate} />
        </TabsContent>

        <TabsContent value="profit">
          <ProfitMarginCalculatorEngine onCalculate={handleCalculate} />
        </TabsContent>
      </Tabs>
    </ToolLayout>
  )
}

export default function KpiCalculatorTool() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center font-mono text-sm text-muted-foreground animate-pulse">
          Loading KPI Calculator Engines...
        </div>
      }
    >
      <KpiCalculatorContent />
    </Suspense>
  )
}