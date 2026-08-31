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

const toolMeta: ToolMetadata = {
  id: 'calorie-calculator',
  name: 'Daily Calorie & BMR Calculator',
  description:
    'Calculate your Basal Metabolic Rate (BMR), Total Daily Energy Expenditure (TDEE), and custom macronutrient splits for weight loss, maintenance, or muscle gain.',
  category: {
    id: 'calculators',
    name: 'Calculators',
    slug: 'calculators',
  },
  icon: Flame,
  privacyBadge: '100% Client-Side • Mifflin-St Jeor Precision Science',
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
}

type UnitSystem = 'metric' | 'imperial'
type Gender = 'male' | 'female'
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra'
type Goal = 'extreme_loss' | 'loss' | 'mild_loss' | 'maintain' | 'mild_gain' | 'gain'

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { label: string; desc: string; mult: number }> = {
  sedentary: { label: 'Sedentary', desc: 'Little or no exercise, desk job', mult: 1.2 },
  light: { label: 'Lightly Active', desc: 'Light exercise/sports 1-3 days/week', mult: 1.375 },
  moderate: { label: 'Moderately Active', desc: 'Moderate exercise/sports 3-5 days/week', mult: 1.55 },
  very: { label: 'Very Active', desc: 'Hard exercise/sports 6-7 days a week', mult: 1.725 },
  extra: { label: 'Extra Active', desc: 'Very hard exercise, physical job or 2x training', mult: 1.9 },
}

const GOALS: Record<Goal, { label: string; diff: number; desc: string }> = {
  extreme_loss: { label: 'Extreme Fat Loss (-1 kg/wk)', diff: -1000, desc: 'Aggressive deficit' },
  loss: { label: 'Fat Loss (-0.5 kg/wk)', diff: -500, desc: 'Standard sustainable deficit' },
  mild_loss: { label: 'Mild Weight Loss (-0.25 kg/wk)', diff: -250, desc: 'Gentle deficit' },
  maintain: { label: 'Maintain Weight', diff: 0, desc: 'Weight stability' },
  mild_gain: { label: 'Lean Gain (+0.25 kg/wk)', diff: 250, desc: 'Controlled surplus' },
  gain: { label: 'Muscle Gain (+0.5 kg/wk)', diff: 500, desc: 'Standard bulking surplus' },
}

export default function CalorieCalculatorTool() {
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

  const handleCopySummary = () => {
    incrementToolUsage()
    markToolUsed('calorie-calculator')
    logToolActivity({
      toolId: 'calorie-calculator',
      toolName: 'Daily Calorie & BMR Calculator',
      category: 'Calculators',
      actionTitle: `Calorie Target: ${targetCalories} kcal/day (${GOALS[goal].label})`,
      details: `BMR: ${Math.round(bmr)} kcal, TDEE: ${Math.round(tdee)} kcal, Protein: ${proteinGrams}g, Carbs: ${carbGrams}g, Fat: ${fatGrams}g`,
      inputSnippet: `Age: ${age}, Weight: ${weight} ${units === 'metric' ? 'kg' : 'lbs'}, Height: ${height} ${units === 'metric' ? 'cm' : 'in'}, Activity: ${ACTIVITY_MULTIPLIERS[activity].label}`,
      outputSnippet: `${targetCalories} kcal/day | P: ${proteinGrams}g, C: ${carbGrams}g, F: ${fatGrams}g`,
    })
    const summary = `Daily Calorie & Nutrition Plan:
• BMR (Basal Metabolic Rate): ${Math.round(bmr)} kcal/day
• TDEE (Maintenance): ${Math.round(tdee)} kcal/day
• Target Calories (${GOALS[goal].label}): ${targetCalories} kcal/day
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
              Metric (kg / cm)
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
              Imperial (lbs / in)
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
              Male
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
              Female
            </button>
          </div>
        </div>

        {/* Main Grid: Inputs vs Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs Section */}
          <div className="lg:col-span-7 space-y-6 bg-card border border-border/70 p-6 sm:p-8 rounded-3xl shadow-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Scale className="h-5 v-5 text-primary" />
                Body Metrics & Parameters
              </h3>
              <span className="text-xs text-muted-foreground font-medium">Mifflin-St Jeor</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Age */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Age (years)</label>
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
                  Weight ({units === 'metric' ? 'kg' : 'lbs'})
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
                  Height ({units === 'metric' ? 'cm' : 'inches'})
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
                <Activity className="h-4 w-4 text-primary" /> Weekly Activity Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).map((level) => {
                  const item = ACTIVITY_MULTIPLIERS[level]
                  const isSelected = activity === level
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setActivity(level)}
                      className={`text-left p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs'
                          : 'border-border/70 bg-background hover:border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="font-semibold text-xs text-foreground flex items-center justify-between">
                        {item.label}
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1 leading-tight">{item.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Goal */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Target className="h-4 w-4 text-primary" /> Fitness Goal
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(Object.keys(GOALS) as Goal[]).map((g) => {
                  const item = GOALS[g]
                  const isSelected = goal === g
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGoal(g)}
                      className={`text-left p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs'
                          : 'border-border/70 bg-background hover:border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <div className="font-semibold text-xs text-foreground flex items-center justify-between">
                        {item.label}
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1 leading-tight">{item.desc}</div>
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
                  <h3 className="text-lg font-bold text-foreground">Calorie Target</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopySummary}
                  className="rounded-xl h-9 text-xs gap-1.5 shadow-xs bg-background"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy Plan'}
                </Button>
              </div>

              <div className="bg-background/80 backdrop-blur-xs border border-border/80 p-6 rounded-2xl text-center space-y-1 shadow-inner">
                <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Daily Energy Goal</div>
                <div className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                  {Math.round(targetCalories)} <span className="text-lg font-medium text-muted-foreground">kcal</span>
                </div>
                <div className="text-xs text-primary font-medium pt-1">
                  {goal.includes('loss') ? 'Calorie Deficit Mode' : goal.includes('gain') ? 'Calorie Surplus Mode' : 'Maintenance Mode'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background/60 border border-border/60 p-4 rounded-2xl text-center">
                  <div className="text-[11px] text-muted-foreground font-semibold">BMR (Resting)</div>
                  <div className="text-xl font-bold text-foreground mt-0.5">{Math.round(bmr)} <span className="text-xs text-muted-foreground font-normal">kcal</span></div>
                </div>
                <div className="bg-background/60 border border-border/60 p-4 rounded-2xl text-center">
                  <div className="text-[11px] text-muted-foreground font-semibold">TDEE (Maintenance)</div>
                  <div className="text-xl font-bold text-foreground mt-0.5">{Math.round(tdee)} <span className="text-xs text-muted-foreground font-normal">kcal</span></div>
                </div>
              </div>

              {/* Macronutrient Breakdown */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <PieChart className="h-4 w-4 text-primary" /> Recommended Macros (30/40/30)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-background/60 border border-border/60 p-3 rounded-2xl text-center">
                    <div className="text-[10px] uppercase font-bold text-blue-500">Protein</div>
                    <div className="text-lg font-extrabold text-foreground mt-0.5">{proteinGrams}g</div>
                    <div className="text-[10px] text-muted-foreground">{Math.round(proteinCalories)} kcal</div>
                  </div>
                  <div className="bg-background/60 border border-border/60 p-3 rounded-2xl text-center">
                    <div className="text-[10px] uppercase font-bold text-amber-500">Carbs</div>
                    <div className="text-lg font-extrabold text-foreground mt-0.5">{carbGrams}g</div>
                    <div className="text-[10px] text-muted-foreground">{Math.round(carbCalories)} kcal</div>
                  </div>
                  <div className="bg-background/60 border border-border/60 p-3 rounded-2xl text-center">
                    <div className="text-[10px] uppercase font-bold text-rose-500">Fats</div>
                    <div className="text-lg font-extrabold text-foreground mt-0.5">{fatGrams}g</div>
                    <div className="text-[10px] text-muted-foreground">{Math.round(fatCalories)} kcal</div>
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
