"use client"

import React, { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useTheme } from "next-themes"
import {
  TrendingUp,
  DollarSign,
  Users,
  PieChart,
  Percent,
  Calendar,
  Sparkles,
  Info,
  ChevronDown,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  BarChart3,
  Sun,
  Moon,
  Menu,
  X,
  Star,
  LayoutDashboard,
  Code,
  FileText,
  Binary,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { isFavoriteTool, toggleFavoriteTool } from '@/actions/favorites'

const toolContent = {
  roi: {
    features: [
      { icon: Zap, title: "Time-Weighted Logic", desc: "Computes compounded annualized yield rates instantly based on continuous financial calendars." },
      { icon: PieChart, title: "Dynamic Matrix Chart", desc: "Visualizes your precise initial investment capital weight versus generated net gains in real-time." },
      { icon: Shield, title: "Local Browser Privacy", desc: "All investment data points and currency calculations are handled 100% locally in your client device." },
      { icon: CheckCircle2, title: "Zero Account Needed", desc: "Get full granular performance tracking completely free without mandatory profile registrations." }
    ],
    faqs: [
      { q: "What is the difference between Total ROI and Annualized ROI?", a: "Total ROI shows your absolute return rate regardless of time. Annualized ROI factors in the exact duration of the investment, displaying the geometric average rate of return earned each year, which is crucial for comparing multi-year assets." },
      { q: "Is this financial calculator safe for proprietary company ledgers?", a: "Absolutely. No tracking payloads or inputs are transmitted to external cloud servers. The entire computational execution runs client-side in your secure browser instance." },
      { q: "How accurate is the investment length calculation?", a: "It utilizes exact JavaScript timestamp delta operations adjusted for leap years (365.25 days framework), ensuring high mathematical precision for institutional reports." }
    ]
  },
  product: {
    features: [
      { icon: Users, title: "LTV : CAC Benchmarking", desc: "Auto-evaluates your corporate unit economics against the golden 3.0x venture health metrics." },
      { icon: Clock, title: "Payback Period Metrics", desc: "Isolates the exact temporal scale required to fully recover your marketing acquisition overheads." },
      { icon: Shield, title: "Secure Growth Tracking", desc: "Audit your unit economic thresholds privately without publishing strategic customer acquisition costs." },
      { icon: Zap, title: "Real-Time Adjustments", desc: "Slide or modify customer churn boundaries and instantly map shifts in user lifetime values." }
    ],
    faqs: [
      { q: "What is a healthy LTV : CAC ratio benchmark?", a: "A healthy venture-backed or bootstrapped ratio is typically 3.0x or higher. Anything below 1.0x indicates you are losing capital on every acquired customer, while ratios above 5.0x might mean you are under-investing in growth." },
      { q: "How is the Churn Rate factor handled in the calculation?", a: "The Lifetime Value (LTV) engine divides your Average Revenue Per User (ARPU) by the monthly churn rate percentage, effectively compounding the projected longevity of user revenue streams." },
      { q: "Can I use this for non-SaaS transactional business models?", a: "Yes. For traditional e-commerce or retail setups, replace 'Monthly ARPU' with your average historical customer profit contribution per month to get accurate outcomes." }
    ]
  },
  profit: {
    features: [
      { icon: Percent, title: "Dual Yield Estimation", desc: "Calculates both Margin and Markup metrics simultaneously to eliminate common retail accounting mistakes." },
      { icon: DollarSign, title: "Absolute Gross Profit", desc: "Converts raw margins into clear monetary liquidity representations so you see the exact cash earned." },
      { icon: Shield, title: "Encrypted Ledger Operations", desc: "Input manufacturing costs and sales revenues safely with absolute zero-server tracking architecture." },
      { icon: Zap, title: "Instant Unit Pricing", desc: "Allows rapid price testing scenarios for digital products, hardware goods, and enterprise consulting." }
    ],
    faqs: [
      { q: "What is the core difference between Profit Margin and Markup?", a: "Profit Margin is the ratio of gross profit divided by total revenue (selling price). Markup is the ratio of gross profit divided by the original Cost of Goods Sold (COGS). Margin is always lower than Markup." },
      { q: "Why do I need to calculate both fields?", a: "Calculating Margin is essential for reviewing overall business profitability on financial statements, whereas applying a Markup is much easier and highly reliable when physically pricing individual inventory stock units." },
      { q: "Does the cost parameter include operating expenses (OpEx)?", a: "This engine evaluates Gross Profit metrics using COGS (direct production costs). To calculate Net Margin instead, simply add your overhead operating expenses into the cost input box." }
    ]
  }
}

export default function KpiCalculatorTool() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(false)
  const { theme, setTheme } = useTheme()
  const activeTab = (searchParams.get("tab") || "roi") as "roi" | "product" | "profit"

  // States للهيدر المتنقل والقائمة المحمولة
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // 1. States لـ ROI
  const [amountInvested, setAmountInvested] = useState("1200")
  const [amountReturned, setAmountReturned] = useState("2000")
  const [fromDate, setFromDate] = useState("2026-05-24")
  const [toDate, setToDate] = useState("2030-12-31")

  // 2. States لـ CAC & LTV
  const [marketingSpend, setMarketingSpend] = useState("5000")
  const [newCustomers, setNewCustomers] = useState("100")
  const [arpu, setArpu] = useState("50")
  const [churnRate, setChurnRate] = useState("5")

  // 3. States لـ Profit Margin
  const [revenue, setRevenue] = useState("10000")
  const [cogs, setCogs] = useState("6000")

  // State للـ FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const [mounted, setMounted] = useState(false)

  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculation = async () => {
    setIsCalculating(true);
    await handleSomething();
    setIsCalculating(false);
  };

  const handleToggleFavorite = async () => {
    const nextFavorite = !isFavorite
    setIsFavorite(nextFavorite)

    try {
      await toggleFavoriteTool("kpi-calculator-tool")
      router.refresh()
    } catch (error) {
      setIsFavorite(!nextFavorite)
      console.error("Error toggling favorite:", error)
    }
  }

  const handleSomething = async () => {
    try {
      await Promise.all([
        incrementToolUsage(),
        markToolUsed("kpi-calculator-tool")
      ]);
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const loadFavorite = async () => {
      const favorite = await isFavoriteTool("kpi-calculator-tool")
      setIsFavorite(favorite)
    }

    loadFavorite()
  }, [])

  // إعادة ضبط الـ Accordion عند تغيير الأداة
  useEffect(() => { setOpenFaq(null) }, [activeTab])

  if (!mounted) return <div className="p-8 text-center font-mono text-sm animate-pulse">Loading Analytics Engines...</div>

  // --- المعادلات الحسابية ---
  const roiRes = (() => {
    const invested = parseFloat(amountInvested) || 0
    const returned = parseFloat(amountReturned) || 0
    const gain = returned - invested
    const roiPercentage = invested > 0 ? (gain / invested) * 100 : 0
    const start = new Date(fromDate)
    const end = new Date(toDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const investmentYears = diffTime / (1000 * 60 * 60 * 24 * 365.25) || 0
    let annualizedRoi = 0
    if (invested > 0 && returned > 0 && investmentYears > 0) {
      annualizedRoi = (Math.pow((returned / invested), (1 / investmentYears)) - 1) * 100
    }
    const totalPie = invested + Math.max(0, gain)
    const investedWeight = totalPie > 0 ? (invested / totalPie) * 100 : 50
    return { gain, roiPercentage, years: investmentYears, annualizedRoi, investedWeight }
  })()

  const growthRes = (() => {
    const spend = parseFloat(marketingSpend) || 0
    const customers = parseFloat(newCustomers) || 0
    const userArpu = parseFloat(arpu) || 0
    const churn = (parseFloat(churnRate) || 0) / 100
    const cac = customers > 0 ? spend / customers : 0
    const ltv = churn > 0 ? userArpu / churn : 0
    const ltvToCacRatio = cac > 0 ? ltv / cac : 0
    const monthsToRecover = userArpu > 0 && cac > 0 ? cac / userArpu : 0
    return { cac, ltv, ltvToCacRatio, monthsToRecover }
  })()

  const marginRes = (() => {
    const rev = parseFloat(revenue) || 0
    const cost = parseFloat(cogs) || 0
    const grossProfit = rev - cost
    const grossMargin = rev > 0 ? (grossProfit / rev) * 100 : 0
    const markup = cost > 0 ? (grossProfit / cost) * 100 : 0
    return { grossProfit, grossMargin, markup }
  })()

  const currentContent = toolContent[activeTab]

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">

      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between w-full gap-4">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground leading-none">
                  Digital Mix
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  KPI Calculator
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-muted-foreground hover:text-foreground"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="sr-only">Toggle theme</span>
              </Button>

              <Button
                variant="ghost"
                className={`hidden sm:flex gap-2 font-medium h-9 px-3 ${isFavorite
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                onClick={handleToggleFavorite}
              >
                <Star
                  className={`h-4 w-4 ${isFavorite ? "fill-amber-500 text-amber-500" : ""
                    }`}
                />
                {isFavorite ? "Favorited" : "Favorite"}
              </Button>

              <Button
                asChild
                variant="ghost"
                className="hidden sm:flex text-muted-foreground hover:text-foreground"
              >
                <Link href="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden text-muted-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* قائمة الموبايل للربط */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl p-4 space-y-2">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-2 ${isFavorite
                ? "text-amber-500 hover:text-amber-600"
                : "text-foreground"
                }`}
              onClick={handleToggleFavorite}
            >
              <Star
                className={`h-4 w-4 ${isFavorite ? "fill-amber-500 text-amber-500" : ""
                  }`}
              />
              {isFavorite ? "Favorited" : "Favorite"}
            </Button>

            <Button
              asChild
              variant="ghost"
              className="w-full text-foreground justify-start gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
        )}
      </header>

      {/* Hero Header الرئيسي للأداة */}
      <div className="py-12 px-4 text-center bg-gradient-to-b from-primary/5 to-transparent border-b border-border/40">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2 flex items-center justify-center gap-2">
          <TrendingUp className="h-8 w-8 text-primary" /> Institutional KPI Calculator Suite
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
          Deep computational framework tracking compounded investment metrics, macro growth structures, and yield distribution metrics locally.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <Tabs value={activeTab} onValueChange={(val) => router.push(`?tab=${val}`)} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto h-11 bg-secondary/60 p-1 rounded-xl">
            <TabsTrigger value="roi" className="rounded-lg text-xs md:text-sm font-semibold">
              Advanced ROI
            </TabsTrigger>
            <TabsTrigger value="product" className="rounded-lg text-xs md:text-sm font-semibold">
              CAC & LTV Engine
            </TabsTrigger>
            <TabsTrigger value="profit" className="rounded-lg text-xs md:text-sm font-semibold">
              Margins & Markup
            </TabsTrigger>
          </TabsList>

          {/* 1. CONTENT BLOCK: ADVANCED ROI */}
          <TabsContent value="roi" className="grid grid-cols-1 lg:grid-cols-12 gap-6 focus-visible:outline-none">
            <div className="lg:col-span-5 p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">Investment Parameters</h3>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Amount Invested ($)</label>
                <div className="flex items-center rounded-xl border border-border bg-background px-3 py-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <input type="number" value={amountInvested} onChange={(e) => setAmountInvested(e.target.value)} className="w-full bg-transparent p-2 text-sm focus:outline-none font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Amount Returned ($)</label>
                <div className="flex items-center rounded-xl border border-border bg-background px-3 py-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <input type="number" value={amountReturned} onChange={(e) => setAmountReturned(e.target.value)} className="w-full bg-transparent p-2 text-sm focus:outline-none font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> From Date</label>
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full rounded-xl border border-border bg-background p-2.5 text-xs focus:outline-none font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> To Date</label>
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full rounded-xl border border-border bg-background p-2.5 text-xs focus:outline-none font-mono" />
                </div>
              </div>
              <Button
                onClick={handleCalculation}
                disabled={isCalculating}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-md mt-4"
              >
                {isCalculating ? "Processing..." : "Calculate & Track"}
              </Button>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-md shadow-sm">
              <div className="md:col-span-7 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> Computed Yield Report</h3>
                <div className="divide-y divide-border/60">
                  <div className="py-3 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-medium">Investment Gain</span>
                    <span className={`text-base font-mono font-bold ${roiRes.gain >= 0 ? "text-emerald-500" : "text-destructive"}`}>${roiRes.gain.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="py-3 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-medium">Total ROI</span>
                    <span className={`text-base font-mono font-bold ${roiRes.roiPercentage >= 0 ? "text-emerald-500" : "text-destructive"}`}>{roiRes.roiPercentage.toFixed(2)}%</span>
                  </div>
                  <div className="py-3 flex justify-between items-center bg-primary/5 px-2 rounded-lg my-1 border-y border-primary/10">
                    <span className="text-sm text-foreground font-semibold flex items-center gap-1">Annualized ROI <span title="Compounded annualized yield rate" className="cursor-help text-muted-foreground"><Info className="h-3 w-3" /></span></span>
                    <span className="text-lg font-mono font-extrabold text-primary">{roiRes.annualizedRoi.toFixed(2)}%</span>
                  </div>
                  <div className="py-3 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-medium">Investment Length</span>
                    <span className="text-sm font-mono text-foreground font-semibold">{roiRes.years.toFixed(3)} Years</span>
                  </div>
                </div>
              </div>
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4 border-l border-border/40 space-y-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Asset Matrix Share</span>
                <div className="relative w-32 h-32 rounded-full flex items-center justify-center border-4 border-muted overflow-hidden" style={{ background: `conic-gradient(#3b82f6 0% ${roiRes.investedWeight}%, #10b981 ${roiRes.investedWeight}% 100%)` }}>
                  <div className="absolute w-24 h-24 rounded-full bg-card flex flex-col items-center justify-center text-[10px] text-muted-foreground font-mono font-bold shadow-inner">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> {roiRes.investedWeight.toFixed(0)}% Inv</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> {(100 - roiRes.investedWeight).toFixed(0)}% Gain</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 2. CONTENT BLOCK: CAC & LTV */}
          <TabsContent value="product" className="grid grid-cols-1 lg:grid-cols-2 gap-6 focus-visible:outline-none">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" /> Growth Inputs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Total Marketing Spend ($)</label>
                  <input type="number" value={marketingSpend} onChange={(e) => setMarketingSpend(e.target.value)} className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-mono focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">New Customers Acquired</label>
                  <input type="number" value={newCustomers} onChange={(e) => setNewCustomers(e.target.value)} className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-mono focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">ARPU ($ / Monthly)</label>
                  <input type="number" value={arpu} onChange={(e) => setArpu(e.target.value)} className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-mono focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Monthly Churn Rate (%)</label>
                  <input type="number" value={churnRate} onChange={(e) => setChurnRate(e.target.value)} className="w-full rounded-xl border border-border bg-background p-2.5 text-sm font-mono focus:outline-none" />
                </div>
              </div>
              <Button
                onClick={handleCalculation}
                disabled={isCalculating}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-md mt-4"
              >
                {isCalculating ? "Processing..." : "Calculate & Track"}
              </Button>
            </div>

            <div className="p-6 rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-md grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-background border border-border flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">Customer Acquisition Cost (CAC)</span>
                <span className="text-xl font-mono font-bold text-foreground mt-2">${growthRes.cac.toFixed(2)}</span>
              </div>
              <div className="p-4 rounded-xl bg-background border border-border flex flex-col justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">Customer Lifetime Value (LTV)</span>
                <span className="text-xl font-mono font-bold text-foreground mt-2">${growthRes.ltv.toFixed(2)}</span>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-primary uppercase block">LTV : CAC Unit Ratio</span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Target health threshold benchmark &gt; 3.0x</p>
                </div>
                <span className={`text-2xl font-mono font-extrabold ${growthRes.ltvToCacRatio >= 3 ? "text-emerald-500" : "text-amber-500"}`}>{growthRes.ltvToCacRatio.toFixed(1)}x</span>
              </div>
              <div className="p-4 rounded-xl bg-background border border-border col-span-2 flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">Months to Recover CAC Cost</span>
                <span className="text-sm font-mono font-bold text-foreground">{growthRes.monthsToRecover.toFixed(1)} Months</span>
              </div>
            </div>
          </TabsContent>

          {/* 3. CONTENT BLOCK: MARGINS & MARKUP */}
          <TabsContent value="profit" className="grid grid-cols-1 lg:grid-cols-2 gap-6 focus-visible:outline-none">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"><PieChart className="h-4 w-4" /> Capital Parameters</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Total Gross Revenue ($)</label>
                  <input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} className="w-full rounded-xl border border-border bg-background p-3 text-sm font-mono focus:outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-medium">Cost of Goods Sold / COGS ($)</label>
                  <input type="number" value={cogs} onChange={(e) => setCogs(e.target.value)} className="w-full rounded-xl border border-border bg-background p-3 text-sm font-mono focus:outline-none" />
                </div>
              </div>
              <Button
                onClick={handleCalculation}
                disabled={isCalculating}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-md mt-4"
              >
                {isCalculating ? "Processing..." : "Calculate & Track"}
              </Button>
              
            </div>
            <div className="p-6 rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-md space-y-4 flex flex-col justify-center">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <span className="text-sm text-muted-foreground font-medium">Gross Profit Cash Value</span>
                <span className="text-base font-mono font-bold text-foreground">${marginRes.grossProfit.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <span className="text-sm text-muted-foreground font-medium">Gross Profit Margin Percentage</span>
                <span className="text-xl font-mono font-extrabold text-primary">{marginRes.grossMargin.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-sm text-muted-foreground font-medium block">Product Markup Percentage</span>
                  <span className="text-[11px] text-muted-foreground block">Cost multiplication conversion rate</span>
                </div>
                <span className="text-base font-mono font-bold text-emerald-500">{marginRes.markup.toFixed(2)}%</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* قسم الـ Features المتغير لايف حسب الـ Tab */}
        <div className="mt-20 space-y-8">
          <h2 className="text-2xl font-bold tracking-tight text-center md:text-3xl">
            Why Use Our {activeTab === "roi" ? "Advanced ROI Tool" : activeTab === "product" ? "CAC & LTV Engine" : "Margins Calculator"}?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentContent.features.map((feat, index) => (
              <div key={index} className="p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-sm shadow-sm space-y-3 transition-all hover:border-primary/30 hover:bg-card">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <feat.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground tracking-tight">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* قسم الـ FREQUENTLY ASKED QUESTIONS الأكورديون التفاعلي */}
        <div className="mt-24 max-w-3xl mx-auto space-y-8">
          <h2 className="text-2xl font-bold tracking-tight text-center md:text-3xl">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {currentContent.faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div key={index} className="rounded-xl border border-border bg-card/60 overflow-hidden transition-colors duration-200">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
                  >
                    <span className="text-sm font-semibold tracking-tight text-foreground pr-4">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`} />
                  </button>
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "max-h-48 border-t border-border/40" : "max-h-0"}`}>
                    <p className="p-5 text-xs md:text-sm text-muted-foreground leading-relaxed bg-secondary/20">
                      {faq.a}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 🛠️ Suggested Tools Section (Internal Linking) */}
        <div className="mt-20 max-w-3xl mx-auto space-y-6">
          <h3 className="text-xl font-bold tracking-tight text-center">Suggested Utility Tools</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <Link
              href="/tools/sql-formatter"
              className="group p-4 rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm hover:bg-card hover:border-primary/40 transition-all duration-200 flex flex-col justify-between h-28"
            >
              <div className="p-2 rounded-lg bg-secondary text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors w-fit">
                <Code className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">SQL Formatter</h4>
                <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">Beautify and optimize database queries.</p>
              </div>
            </Link>

            <Link
              href="/tools/pdf-merge"
              className="group p-4 rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm hover:bg-card hover:border-primary/40 transition-all duration-200 flex flex-col justify-between h-28"
            >
              <div className="p-2 rounded-lg bg-secondary text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors w-fit">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">PDF Merge Pro</h4>
                <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">Organize and combine PDF pages locally.</p>
              </div>
            </Link>

            <Link
              href="/tools/regex-tester"
              className="group p-4 rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm hover:bg-card hover:border-primary/40 transition-all duration-200 flex flex-col justify-between h-28"
            >
              <div className="p-2 rounded-lg bg-secondary text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors w-fit">
                <Binary className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">Regex Tester</h4>
                <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                  Build and validate regular expressions with real-time feedback.
                </p>
              </div>
            </Link>

          </div>
        </div>

      </div>
    </div>
  )
}