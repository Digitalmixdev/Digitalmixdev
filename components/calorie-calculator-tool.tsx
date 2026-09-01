'use client'

import React, { useState } from 'react'
import {
  Flame,
  Activity,
  Scale,
  Target,
  PieChart,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Heart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { logToolActivity } from '@/lib/history-service'
import { useLanguage } from '@/lib/i18n/context'

const toolMeta: ToolMetadata = {
  id: 'calorie-calculator',
  name: 'Daily Calorie & BMR Calculator',
  name_ar: 'حاسبة السعرات الحرارية ومعدل الأيض BMR',
  description:
    'Calculate your Basal Metabolic Rate (BMR), Total Daily Energy Expenditure (TDEE), and custom macronutrient splits for weight loss, maintenance, or muscle gain.',
  description_ar:
    'حساب معدل الأيض الأساسي (BMR)، إجمالي الطاقة المستهلكة يومياً (TDEE)، وتوزيع المغذيات الكبرى (بروتين، كربوهيدرات، دهون) للتخسيس أو تثبيت الوزن أو زيادة العضلات.',
  category: {
    id: 'calculators',
    name: 'Calculators',
    slug: 'calculators',
  },
  icon: Flame,
  privacyBadge: '100% Client-Side • Mifflin-St Jeor Precision Science',
  privacyBadge_ar: '100% معالجة داخل متصفحك • معادلة Mifflin-St Jeor العلمية',
  features: [
    {
      icon: Flame,
      title: 'Mifflin-St Jeor Formula',
      desc: 'Uses the gold-standard scientific equation for estimating resting metabolic rate.',
    },
    {
      icon: Activity,
      title: 'Activity Multipliers',
      desc: 'Factors in your exact weekly exercise volume and daily non-exercise activity (NEAT).',
    },
    {
      icon: PieChart,
      title: 'Macronutrient Breakdown',
      desc: 'Generates optimal protein, carbohydrate, and dietary fat grams tailored to your fitness goal.',
    },
    {
      icon: Target,
      title: 'Goal Calibration',
      desc: 'Adjusts target intake dynamically for safe fat loss, lean bulking, or body recomposition.',
    },
  ],
  features_ar: [
    {
      icon: Flame,
      title: 'معادلة Mifflin-St Jeor الدقيقة',
      desc: 'تستخدم المعادلة العلمية الذهبية لحساب معدل الحرق في وضع الراحة.',
    },
    {
      icon: Activity,
      title: 'معاملات المجهود والنشاط',
      desc: 'تأخذ بعين الاعتبار مستوى تمارينك الأسبوعية والحركة اليومية.',
    },
    {
      icon: PieChart,
      title: 'توزيع المغذيات الكبرى (Macros)',
      desc: 'حساب غرامات البروتين والكربوهيدرات والدهون الصحية وفقاً لهدفك.',
    },
    {
      icon: Target,
      title: 'معايرة الأهداف الذكية',
      desc: 'تعديل السعرات تلقائياً لخسارة الدهون، أو البناء العضلي، أو تثبيت الوزن.',
    },
  ],
  faqs: [
    {
      q: 'What is BMR vs. TDEE?',
      a: 'BMR (Basal Metabolic Rate) is the number of calories your body burns at complete rest to sustain vital organ function. TDEE (Total Daily Energy Expenditure) includes BMR plus calories burned through daily movement, digestion, and exercise.',
    },
    {
      q: 'How accurate is the Mifflin-St Jeor formula?',
      a: 'Clinical studies show the Mifflin-St Jeor equation is the most accurate predictive equation for estimating resting metabolic rate in healthy adults, typically within 10% of indirect calorimetry measurements.',
    },
    {
      q: 'How should I set my macro split?',
      a: 'For general fitness and weight management, a balanced split of 30% protein, 40% carbohydrates, and 30% fats is widely recommended. Higher protein splits (35-40%) are beneficial during aggressive calorie deficits to preserve lean muscle mass.',
    },
  ],
  faqs_ar: [
    {
      q: 'ما الفرق بين BMR و TDEE؟',
      a: 'BMR (معدل الأيض الأساسي) هو عدد السعرات التي يحرقها جسمك في وضع الراحة التامة للحفاظ على وظائف الأعضاء الحيوية. بينما TDEE (إجمالي استهلاك الطاقة اليومي) يشمل BMR بالإضافة إلى السعرات المحروقة من الحركة والتمارين والهضم.',
    },
    {
      q: 'ما مدى دقة معادلة Mifflin-St Jeor؟',
      a: 'تظهر الدراسات السريرية أن معادلة Mifflin-St Jeor هي الأدق علمياً لتقدير معدل الأيض الأساسي لدى البالغين الأصحاء بنسبة خطأ لا تتعدى 10%.',
    },
    {
      q: 'كيف أوزع المغذيات الكبرى (Macros)؟',
      a: 'للياقة العامة وتثبيت الوزن، يُنصح بتوزيع 30% بروتين، 40% كربوهيدرات، و 30% دهون صحية. في حالات التخسيس، يُفضل زيادة البروتين (35-40%) للحفاظ على الكتلة العضلية.',
    },
  ],
}

type UnitSystem = 'metric' | 'imperial'
type Gender = 'male' | 'female'
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra'
type Goal = 'extreme_loss' | 'loss' | 'mild_loss' | 'maintain' | 'mild_gain' | 'gain'

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { label: string; label_ar: string; desc: string; desc_ar: string; mult: number }> = {
  sedentary: {
    label: 'Sedentary',
    label_ar: 'خامل / بدون تمارين',
    desc: 'Little or no exercise, desk job',
    desc_ar: 'نشاط بدني قليل جداً، عمل مكتبي',
    mult: 1.2,
  },
  light: {
    label: 'Lightly Active',
    label_ar: 'نشاط خفيف',
    desc: 'Light exercise/sports 1-3 days/week',
    desc_ar: 'تمارين خفيفة 1-3 أيام أسبوعياً',
    mult: 1.375,
  },
  moderate: {
    label: 'Moderately Active',
    label_ar: 'نشاط متوسط',
    desc: 'Moderate exercise/sports 3-5 days/week',
    desc_ar: 'تمارين متوسطة 3-5 أيام أسبوعياً',
    mult: 1.55,
  },
  very: {
    label: 'Very Active',
    label_ar: 'نشاط عالي',
    desc: 'Hard exercise/sports 6-7 days a week',
    desc_ar: 'تمارين شاقة 6-7 أيام أسبوعياً',
    mult: 1.725,
  },
  extra: {
    label: 'Extra Active',
    label_ar: 'نشاط فائق',
    desc: 'Very hard exercise, physical job or 2x training',
    desc_ar: 'تمارين شاقة جداً أو عمل بدني مجهد',
    mult: 1.9,
  },
}

const GOALS: Record<Goal, { label: string; label_ar: string; diff: number; desc: string; desc_ar: string }> = {
  extreme_loss: {
    label: 'Extreme Fat Loss (-1 kg/wk)',
    label_ar: 'خسارة دهون سريعة (-1 كجم/أسبوع)',
    diff: -1000,
    desc: 'Aggressive deficit',
    desc_ar: 'عجز سعرات شديد',
  },
  loss: {
    label: 'Fat Loss (-0.5 kg/wk)',
    label_ar: 'خسارة دهون (-0.5 كجم/أسبوع)',
    diff: -500,
    desc: 'Standard sustainable deficit',
    desc_ar: 'عجز متوازن ومستدام',
  },
  mild_loss: {
    label: 'Mild Weight Loss (-0.25 kg/wk)',
    label_ar: 'خسارة وزن خفيفة (-0.25 كجم/أسبوع)',
    diff: -250,
    desc: 'Gentle deficit',
    desc_ar: 'عجز تدريجي خفيف',
  },
  maintain: {
    label: 'Maintain Weight',
    label_ar: 'تثبيت الوزن الحالي',
    diff: 0,
    desc: 'Weight stability',
    desc_ar: 'توازن الطاقة',
  },
  mild_gain: {
    label: 'Lean Gain (+0.25 kg/wk)',
    label_ar: 'زيادة عضلية خفيفة (+0.25 كجم/أسبوع)',
    diff: 250,
    desc: 'Controlled surplus',
    desc_ar: 'فائض سعرات محكوم',
  },
  gain: {
    label: 'Muscle Gain (+0.5 kg/wk)',
    label_ar: 'زيادة كتلة عضلية (+0.5 كجم/أسبوع)',
    diff: 500,
    desc: 'Standard bulking surplus',
    desc_ar: 'فائض ضخامة عضلية',
  },
}

export default function CalorieCalculatorTool() {
  const { language } = useLanguage()
  const isArabic = language === 'ar'

  const [units, setUnits] = useState<UnitSystem>('metric')
  const [gender, setGender] = useState<Gender>('male')
  const [age, setAge] = useState('28')
  const [weight, setWeight] = useState('75') // kg or lbs
  const [height, setHeight] = useState('178') // cm or inches
  const [activity, setActivity] = useState<ActivityLevel>('moderate')
  const [goal, setGoal] = useState<Goal>('maintain')
  const [copied, setCopied] = useState(false)

  // Calculations
  const numAge = parseFloat(age) || 0
  const numWeight = parseFloat(weight) || 0
  const numHeight = parseFloat(height) || 0

  // Convert to metric for formula
  let weightKg = numWeight
  let heightCm = numHeight

  if (units === 'imperial') {
    // lbs to kg
    weightKg = numWeight * 0.453592
    // inches to cm
    heightCm = numHeight * 2.54
  }

  // Mifflin-St Jeor BMR
  let bmr = 0
  if (weightKg > 0 && heightCm > 0 && numAge > 0) {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * numAge
    bmr = gender === 'male' ? base + 5 : base - 161
  }

  const tdee = bmr * ACTIVITY_MULTIPLIERS[activity].mult
  const targetCalories = Math.max(1200, Math.round(tdee + GOALS[goal].diff))

  // Macros (Protein: 30%, Carbs: 40%, Fat: 30% of target calories)
  // Protein = 4 kcal/g, Carbs = 4 kcal/g, Fat = 9 kcal/g
  const proteinCalories = targetCalories * 0.3
  const carbCalories = targetCalories * 0.4
  const fatCalories = targetCalories * 0.3

  const proteinGrams = Math.round(proteinCalories / 4)
  const carbGrams = Math.round(carbCalories / 4)
  const fatGrams = Math.round(fatCalories / 9)

  const activeGoalObj = GOALS[goal]
  const activeGoalLabel = isArabic ? activeGoalObj.label_ar : activeGoalObj.label

  const handleCopySummary = () => {
    incrementToolUsage()
    markToolUsed('calorie-calculator')
    logToolActivity({
      toolId: 'calorie-calculator',
      toolName: 'Daily Calorie & BMR Calculator',
      category: 'Calculators',
      actionTitle: `Calorie Target: ${targetCalories} kcal/day (${activeGoalLabel})`,
      details: `BMR: ${Math.round(bmr)} kcal, TDEE: ${Math.round(tdee)} kcal, Protein: ${proteinGrams}g, Carbs: ${carbGrams}g, Fat: ${fatGrams}g`,
      inputSnippet: `Age: ${age}, Weight: ${weight} ${units === 'metric' ? (isArabic ? 'كجم' : 'kg') : (isArabic ? 'رطل' : 'lbs')}, Height: ${height} ${units === 'metric' ? (isArabic ? 'سم' : 'cm') : (isArabic ? 'بوصة' : 'in')}, Activity: ${isArabic ? ACTIVITY_MULTIPLIERS[activity].label_ar : ACTIVITY_MULTIPLIERS[activity].label}`,
      outputSnippet: `${targetCalories} ${isArabic ? 'سعرة/يوم' : 'kcal/day'} | P: ${proteinGrams}g, C: ${carbGrams}g, F: ${fatGrams}g`,
    })

    const summary = isArabic
      ? `خطة السعرات الحرارية والتغذية اليومية:
• معدل الأيض الأساسي (BMR): ${Math.round(bmr)} سعرة/يوم
• إجمالي استهلاك الطاقة (TDEE): ${Math.round(tdee)} سعرة/يوم
• السعرات المستهدفة اليومية (${activeGoalLabel}): ${targetCalories} سعرة/يوم
• المغذيات الكبرى (Macros):
  - البروتين: ${proteinGrams} غرام (${Math.round(proteinCalories)} سعرة)
  - الكربوهيدرات: ${carbGrams} غرام (${Math.round(carbCalories)} سعرة)
  - الدهون الصحية: ${fatGrams} غرام (${Math.round(fatCalories)} سعرة)`
      : `Daily Calorie & Nutrition Plan:
• BMR (Basal Metabolic Rate): ${Math.round(bmr)} kcal/day
• TDEE (Maintenance): ${Math.round(tdee)} kcal/day
• Target Calories (${activeGoalLabel}): ${targetCalories} kcal/day
• Macronutrients:
  - Protein: ${proteinGrams}g (${Math.round(proteinCalories)} kcal)
  - Carbohydrates: ${carbGrams}g (${Math.round(carbCalories)} kcal)
  - Fats: ${fatGrams}g (${Math.round(fatCalories)} kcal)`

    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ToolLayout metadata={toolMeta}>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Unit & Gender Toggle Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-secondary/50 p-2 rounded-2xl border border-border/60">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setUnits('metric')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                units === 'metric'
                  ? 'bg-background text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isArabic ? 'نظام متري (كجم / سم)' : 'Metric (kg / cm)'}
            </button>
            <button
              type="button"
              onClick={() => setUnits('imperial')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                units === 'imperial'
                  ? 'bg-background text-foreground shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isArabic ? 'نظام إمبريال (رطل / بوصة)' : 'Imperial (lbs / in)'}
            </button>
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                gender === 'male'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-background/60 text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              {isArabic ? 'ذكر' : 'Male'}
            </button>
            <button
              type="button"
              onClick={() => setGender('female')}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                gender === 'female'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-background/60 text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              {isArabic ? 'أنثى' : 'Female'}
            </button>
          </div>
        </div>

        {/* Main Grid: Inputs vs Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs Section */}
          <div className="lg:col-span-7 space-y-6 bg-card border border-border/70 p-6 sm:p-8 rounded-3xl shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                {isArabic ? 'القياسات البدنية والمعاملات' : 'Body Metrics & Parameters'}
              </h3>
              <span className="text-xs text-muted-foreground font-medium">Mifflin-St Jeor</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Age */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  {isArabic ? 'العمر (بالسنوات)' : 'Age (years)'}
                </label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  {isArabic
                    ? `الوزن (${units === 'metric' ? 'كجم' : 'رطل'})`
                    : `Weight (${units === 'metric' ? 'kg' : 'lbs'})`}
                </label>
                <input
                  type="number"
                  min="30"
                  max="300"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Height */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  {isArabic
                    ? `الطول (${units === 'metric' ? 'سم' : 'بوصة'})`
                    : `Height (${units === 'metric' ? 'cm' : 'inches'})`}
                </label>
                <input
                  type="number"
                  min="100"
                  max="250"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Activity Level */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-primary" />
                {isArabic ? 'مستوى النشاط الأسبوعي' : 'Weekly Activity Level'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map((level) => {
                  const item = ACTIVITY_MULTIPLIERS[level]
                  const isSelected = activity === level
                  const labelStr = isArabic ? item.label_ar : item.label
                  const descStr = isArabic ? item.desc_ar : item.desc

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setActivity(level)}
                      className={`text-left rtl:text-right p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs'
                          : 'border-border/70 bg-background hover:border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="font-semibold text-xs text-foreground flex items-center justify-between">
                        {labelStr}
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1 leading-tight">{descStr}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Goal */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Target className="h-4 w-4 text-primary" />
                {isArabic ? 'الهدف الرياضي / الوزن' : 'Fitness Goal'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(Object.keys(GOALS) as Goal[]).map((g) => {
                  const item = GOALS[g]
                  const isSelected = goal === g
                  const labelStr = isArabic ? item.label_ar : item.label
                  const descStr = isArabic ? item.desc_ar : item.desc

                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGoal(g)}
                      className={`text-left rtl:text-right p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs'
                          : 'border-border/70 bg-background hover:border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="font-semibold text-xs text-foreground flex items-center justify-between">
                        {labelStr}
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1 leading-tight">{descStr}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-6 w-6 text-primary animate-pulse" />
                  <h3 className="text-lg font-bold text-foreground">
                    {isArabic ? 'هدف السعرات الحرارية' : 'Calorie Target'}
                  </h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySummary}
                  className="rounded-xl h-9 text-xs gap-1.5 shadow-xs bg-background"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied
                    ? (isArabic ? 'تم النسخ' : 'Copied')
                    : (isArabic ? 'نسخ الخطة' : 'Copy Plan')}
                </Button>
              </div>

              <div className="bg-background/80 backdrop-blur-xs border border-border/80 p-6 rounded-2xl text-center space-y-1 shadow-inner">
                <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                  {isArabic ? 'الهدف الحراري اليومي' : 'Daily Energy Goal'}
                </div>
                <div className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                  {Math.round(targetCalories)}{' '}
                  <span className="text-lg font-medium text-muted-foreground">
                    {isArabic ? 'سعرة' : 'kcal'}
                  </span>
                </div>
                <div className="text-xs text-primary font-medium pt-1">
                  {goal.includes('loss')
                    ? (isArabic ? 'وضع عجز السعرات (لتخسيس الدهون)' : 'Calorie Deficit Mode')
                    : goal.includes('gain')
                    ? (isArabic ? 'وضع فائض السعرات (للبناء العضلي)' : 'Calorie Surplus Mode')
                    : (isArabic ? 'وضع تثبيت الوزن (المحافظة)' : 'Maintenance Mode')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background/60 border border-border/60 p-4 rounded-2xl text-center">
                  <div className="text-[11px] text-muted-foreground font-semibold">
                    {isArabic ? 'معدل الأيض الأساسي (BMR)' : 'BMR (Resting)'}
                  </div>
                  <div className="text-xl font-bold text-foreground mt-0.5">
                    {Math.round(bmr)}{' '}
                    <span className="text-xs text-muted-foreground font-normal">
                      {isArabic ? 'سعرة' : 'kcal'}
                    </span>
                  </div>
                </div>
                <div className="bg-background/60 border border-border/60 p-4 rounded-2xl text-center">
                  <div className="text-[11px] text-muted-foreground font-semibold">
                    {isArabic ? 'سعرات المحافظة (TDEE)' : 'TDEE (Maintenance)'}
                  </div>
                  <div className="text-xl font-bold text-foreground mt-0.5">
                    {Math.round(tdee)}{' '}
                    <span className="text-xs text-muted-foreground font-normal">
                      {isArabic ? 'سعرة' : 'kcal'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Macronutrient Breakdown */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <PieChart className="h-4 w-4 text-primary" />
                    {isArabic ? 'توزيع المغذيات الكبرى (30/40/30)' : 'Recommended Macros (30/40/30)'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-background/60 border border-border/60 p-3 rounded-2xl text-center">
                    <div className="text-[10px] uppercase font-bold text-blue-500">
                      {isArabic ? 'بروتين' : 'Protein'}
                    </div>
                    <div className="text-lg font-extrabold text-foreground mt-0.5">
                      {proteinGrams}{isArabic ? 'غ' : 'g'}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {Math.round(proteinCalories)} {isArabic ? 'سعرة' : 'kcal'}
                    </div>
                  </div>
                  <div className="bg-background/60 border border-border/60 p-3 rounded-2xl text-center">
                    <div className="text-[10px] uppercase font-bold text-amber-500">
                      {isArabic ? 'كربوهيدرات' : 'Carbs'}
                    </div>
                    <div className="text-lg font-extrabold text-foreground mt-0.5">
                      {carbGrams}{isArabic ? 'غ' : 'g'}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {Math.round(carbCalories)} {isArabic ? 'سعرة' : 'kcal'}
                    </div>
                  </div>
                  <div className="bg-background/60 border border-border/60 p-3 rounded-2xl text-center">
                    <div className="text-[10px] uppercase font-bold text-rose-500">
                      {isArabic ? 'دهون صحية' : 'Fats'}
                    </div>
                    <div className="text-lg font-extrabold text-foreground mt-0.5">
                      {fatGrams}{isArabic ? 'غ' : 'g'}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {Math.round(fatCalories)} {isArabic ? 'سعرة' : 'kcal'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}

