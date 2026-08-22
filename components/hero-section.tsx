"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import { SearchBox } from "@/components/search-box"

const heroVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

export function HeroSection() {
  return (
    // 1. شيلنا overflow-hidden من هنا وخليناها overflow-visible عشان السيرش يبان
    <section className="relative overflow-visible">
      
      {/* Background Pattern */}
      {/* 2. نقلنا الـ overflow-hidden هنا عشان البلور والدوائر متخربش الصفحة يمين وشمال */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-20 right-1/4 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-10 sm:pt-16 sm:pb-12 lg:pt-20 lg:pb-16">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground"
            variants={itemVariants}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>10+ Essential Tools Launched</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance leading-tight"
            variants={itemVariants}
          >
            Free Digital Tools to{" "}
            <span className="text-primary">Simplify</span> Your Data & Dev Workflow
          </motion.h1>

          {/* Subheading */}
          <motion.p
            className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed"
            variants={itemVariants}
          >
            Powerful, privacy-focused utilities for developers. No sign-up required.
            Process files locally, convert data instantly, and boost your productivity.
          </motion.p>

          {/* Search Bar */}
          <motion.div variants={itemVariants}>
            <SearchBox />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
