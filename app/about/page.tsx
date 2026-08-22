"use strict";

import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Zap, Sparkles, Users, Mail, Compass } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us & Contact | DigitalMix',
  description: 'Learn more about DigitalMix a privacy-first hub providing fast, free, and secure developer utilities and data analytics tools.',
  keywords: ['About DigitalMix', 'Developer utilities', 'Privacy-first tools', 'Contact DigitalMix'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/about',
  }
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto space-y-16">
        
        {/* 1. Hero / Branding Section */}
        <div className="text-center space-y-4">
          <span className="text-xs font-semibold tracking-widest text-blue-500 uppercase px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
            Our Mission
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            About DigitalMix
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            A collection of fast, free, and robust tools designed specifically for developers, data analysts, and tech students. We eliminate unnecessary complexity so you can build faster.
          </p>
        </div>

        {/* 2. Core Pillars (What Makes Us Different) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-2xl space-y-3">
            <Zap className="text-amber-400" size={24} />
            <h3 className="text-lg font-bold text-slate-100">Fast by Design</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Our tools are optimized for performance and simplicity, helping you get results instantly without unnecessary friction.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-2xl space-y-3">
            <Shield className="text-emerald-400" size={24} />
            <h3 className="text-lg font-bold text-slate-100">Privacy-First</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your data never leaves your browser. 100% local operation ensures corporate-grade security.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 p-6 rounded-2xl space-y-3">
            <Sparkles className="text-blue-400" size={24} />
            <h3 className="text-lg font-bold text-slate-100">100% Free</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              No paywalls, no hidden premium tiers. Built to empower the global open-source community.
            </p>
          </div>
        </div>

        {/* 3. Target Audience & The "Why" */}
        <div className="bg-slate-900/20 border border-slate-800/40 p-8 rounded-2xl space-y-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users size={22} className="text-blue-500" /> Built For the Modern Tech Ecosystem
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            As the platform grows, our goal is to build a complete ecosystem of productivity tools, educational resources, and workflows that help technical professionals solve everyday problems more effectively.
          </p>
        </div>

        {/* 4. Contact & Support Section (Essential for Trust & AdSense) */}
        <div className="border-t border-slate-800/80 pt-12 text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-100 flex items-center justify-center gap-2">
            <Mail size={22} className="text-blue-400" /> Get In Touch
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Have a tool suggestion or found a bug? We love hearing from our users. Reach out directly to our engineering support team.
          </p>
          <div className="pt-2">
            <a 
              href="https://mail.google.com/mail/?view=cm&fs=1&to=digitalmixcontact@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-mono text-sm bg-blue-500/5 border border-blue-500/10 px-4 py-2 rounded-xl transition-colors"
            >
              digitalmixcontact@gmail.com
            </a>
          </div>
        </div>

        {/* 5. Call to Action (CTA) */}
        <div className="flex justify-center pt-4">
          <Link 
            href="/"
            className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
          >
            <Compass size={18} />
            Explore Our Tools
          </Link>
        </div>

      </div>
    </main>
  );
}