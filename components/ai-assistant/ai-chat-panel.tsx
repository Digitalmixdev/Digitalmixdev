'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Send,
  X,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Code,
  ArrowRight,
  HelpCircle,
  Copy,
  Check,
  Wand2,
  Search,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n/context'
import { ToolKnowledgeItem } from '@/lib/ai/tools-knowledge'
import { ChatMessage, sendAiMessage } from '@/lib/ai/ai-service'
import { getRegisteredToolInput } from '@/lib/ai/tool-input-bus'

interface AiChatPanelProps {
  isOpen: boolean
  onClose: () => void
  currentTool?: ToolKnowledgeItem
}

export function AiChatPanel({ isOpen, onClose, currentTool }: AiChatPanelProps) {
  const { t, language, isRTL } = useLanguage()
  const isAr = language === 'ar'

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPrivacyConfirm, setShowPrivacyConfirm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom(false)
      // Focus input on desktop
      const timer = setTimeout(() => {
        if (window.innerWidth >= 768) {
          inputRef.current?.focus()
        }
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isOpen, scrollToBottom])

  useEffect(() => {
    scrollToBottom(true)
  }, [messages, isLoading, showPrivacyConfirm, scrollToBottom])

  // Suggested Prompts based on tool context
  const suggestedPrompts = React.useMemo(() => {
    if (currentTool) {
      if (currentTool.id === 'sql-formatter') {
        return [
          { textEn: 'What does minify do?', textAr: 'ماذا يفعل خيار Minify؟' },
          { textEn: 'Which SQL dialects are supported?', textAr: 'ما هي اللهجات المدعومة؟' },
          { textEn: 'How do I use SQL Formatter?', textAr: 'كيف أستخدم SQL Formatter؟' },
          { textEn: 'Suggest related database tools', textAr: 'اقترح أدوات قواعد بيانات مشابهة' },
        ]
      }
      if (currentTool.id === 'json-formatter') {
        return [
          { textEn: 'What can I do with JSON Formatter?', textAr: 'ما الذي يمكنني فعله بأداة JSON Formatter؟' },
          { textEn: 'What does minify do?', textAr: 'ما فائدة تصغير (Minify) الـ JSON؟' },
          { textEn: 'How to convert JSON to CSV?', textAr: 'كيف أحول JSON إلى CSV؟' },
          { textEn: 'Suggest related tools', textAr: 'اقترح أدوات مشابهة' },
        ]
      }
      if (currentTool.id === 'csv-json') {
        return [
          { textEn: 'Which tool should I use for CSV → JSON?', textAr: 'كيف أحول ملفات الإكسيل و CSV إلى JSON؟' },
          { textEn: 'Does this detect numbers & types?', textAr: 'هل تكتشف الأداة أنواع البيانات تلقائياً؟' },
          { textEn: 'Suggest related database tools', textAr: 'اقترح أدوات مرتبطة' },
        ]
      }
      if (currentTool.id === 'jwt') {
        return [
          { textEn: 'How does JWT verification work?', textAr: 'كيف يعمل التحقق من توقيع JWT؟' },
          { textEn: 'Is my secret key safe?', textAr: 'هل المفتاح السري آمن في المتصفح؟' },
          { textEn: 'What are exp and iat claims?', textAr: 'ما معنى exp و iat في التوكن؟' },
        ]
      }
      if (currentTool.id === 'document-converter') {
        return [
          { textEn: 'Which document formats are supported?', textAr: 'ما هي صيغ المستندات المدعومة للتحويل؟' },
          { textEn: 'Can I convert PowerPoint to PDF?', textAr: 'هل يمكن تحويل باوربوينت PPTX إلى PDF؟' },
          { textEn: 'Is file conversion private?', textAr: 'هل تحويل المستندات آمن ومحلي؟' },
        ]
      }
      if (currentTool.id === 'image-converter') {
        return [
          { textEn: 'Which image formats are supported?', textAr: 'ما هي صيغ الصور الـ 14 المدعومة؟' },
          { textEn: 'How do I convert WebP to PNG?', textAr: 'كيف أحول WebP إلى PNG؟' },
          { textEn: 'Can I convert in batches?', textAr: 'هل يمكن التحويل بالدفعات وتنزيل ZIP؟' },
        ]
      }
      if (currentTool.id === 'pdf-merge') {
        return [
          { textEn: 'How do I merge multiple PDFs?', textAr: 'كيف أدمج عدة ملفات PDF في ملف واحد؟' },
          { textEn: 'Can I reorder or delete pages?', textAr: 'هل يمكن إعادة ترتيب أو حذف صفحات؟' },
        ]
      }
      if (currentTool.id === 'kpi-calculator' || currentTool.id === 'roi-calculator' || currentTool.id === 'profit-calculator') {
        return [
          { textEn: 'How is CAC & LTV calculated?', textAr: 'كيف يتم حساب CAC و LTV؟' },
          { textEn: 'What is a good LTV:CAC ratio?', textAr: 'ما هي النسبة المثالية لـ LTV:CAC؟' },
          { textEn: 'How do I calculate ROI?', textAr: 'كيف يتم حساب العائد على الاستثمار ROI؟' },
        ]
      }

      // Generic tool prompts
      return [
        {
          textEn: `How do I use ${currentTool.name}?`,
          textAr: `كيف أستخدم أداة ${currentTool.name}؟`,
        },
        {
          textEn: `What are the features of ${currentTool.name}?`,
          textAr: `ما هي مميزات أداة ${currentTool.name}؟`,
        },
        {
          textEn: 'Suggest related tools',
          textAr: 'اقترح أدوات مشابهة',
        },
      ]
    }

    // Default global prompts
    return [
      { textEn: 'How do I use SQL Formatter?', textAr: 'كيف أستخدم أداة SQL Formatter؟' },
      { textEn: 'Which tool should I use for CSV → JSON?', textAr: 'ما هي الأداة المناسبة لتحويل CSV إلى JSON؟' },
      { textEn: 'What can I do with JSON Formatter?', textAr: 'ما الذي يمكنني فعله بأداة JSON Formatter؟' },
      { textEn: 'Find a tool for me', textAr: 'اقترح لي أداة مناسبة' },
    ]
  }, [currentTool])

  const handleSendMessage = async (textToSend?: string, sharedInputOverride?: string) => {
    const query = (textToSend || inputValue).trim()
    if (!query && !sharedInputOverride) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
      sharedInputSnippet: sharedInputOverride ? sharedInputOverride.slice(0, 150) + (sharedInputOverride.length > 150 ? '...' : '') : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setShowPrivacyConfirm(false)

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await sendAiMessage({
        message: query,
        history,
        currentToolSlug: currentTool?.slug,
        sharedInput: sharedInputOverride,
        language: isAr ? 'ar' : 'en',
      })

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        toolRecommendations: response.recommendedTools,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: isAr
          ? 'عذراً، حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مجدداً.'
          : 'Sorry, an error occurred while processing your request. Please try again.',
        timestamp: Date.now(),
        isError: true,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handlePromptClick = (prompt: { textEn: string; textAr: string }) => {
    const text = isAr ? prompt.textAr : prompt.textEn
    handleSendMessage(text)
  }

  const handleClearChat = () => {
    setMessages([])
    setShowPrivacyConfirm(false)
    toast.success(isAr ? 'تم مسح المحادثة' : 'Chat cleared')
  }

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success(isAr ? 'تم النسخ' : 'Copied to clipboard')
  }

  const handleRequestInputAnalysis = () => {
    const activeInput = getRegisteredToolInput(currentTool?.slug)
    if (!activeInput || activeInput.trim().length === 0) {
      toast.info(t('ai.empty_input_warning', 'No active input found in this tool to analyze.'))
      return
    }
    setShowPrivacyConfirm(true)
  }

  const handleConfirmAnalysis = () => {
    const activeInput = getRegisteredToolInput(currentTool?.slug)
    if (!activeInput) {
      setShowPrivacyConfirm(false)
      toast.info(t('ai.empty_input_warning', 'No active input found in this tool to analyze.'))
      return
    }

    const queryPrompt = isAr
      ? `يرجى فحص وتحليل هذا النص/الكود المدخل في أداة ${currentTool?.name || ''}، واكتشاف أي أخطاء أو تقديم نصائح للتحسين:`
      : `Please analyze my current input in ${currentTool?.name || 'this tool'} for any syntax errors, structure, or optimization tips:`

    handleSendMessage(queryPrompt, activeInput)
  }

  if (!isOpen) return null

  return (
    <div
      id="digitalmix-ai-chat-panel"
      role="dialog"
      aria-labelledby="ai-panel-title"
      aria-describedby="ai-panel-subtitle"
      className={`fixed ${
        isRTL ? 'left-4 sm:left-6' : 'right-4 sm:right-6'
      } bottom-20 z-50 w-[calc(100vw-32px)] sm:w-[400px] h-[580px] max-h-[calc(100vh-100px)] flex flex-col rounded-2xl bg-card/95 text-card-foreground border border-border/80 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-5 overflow-hidden print:hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/40 backdrop-blur-sm select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20 shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 id="ai-panel-title" className="text-sm font-semibold tracking-tight text-foreground truncate">
                {t('ai.title', '✨ DigitalMix AI')}
              </h2>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Online
              </span>
            </div>
            <p id="ai-panel-subtitle" className="text-[11px] text-muted-foreground truncate">
              {currentTool ? (
                <span className="text-blue-500 dark:text-blue-400 font-medium">
                  {currentTool.name}
                </span>
              ) : (
                t('ai.subtitle', 'Your AI guide to DigitalMix')
              )}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearChat}
              title={t('ai.clear_chat', 'Clear Chat')}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            title={t('ai.close', 'Close')}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm scrollbar-thin scrollbar-thumb-muted-foreground/20">
        {/* Welcome State when no messages */}
        {messages.length === 0 && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-300">
            <div className="p-3.5 rounded-xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base">👋</span>
                <h3 className="font-semibold text-foreground text-sm">
                  {t('ai.welcome_title', "Hi! I'm DigitalMix AI 👋")}
                </h3>
              </div>

              {currentTool ? (
                <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    {t('ai.welcome_tool_prefix', "You're currently using")}{' '}
                    <strong className="text-foreground">{currentTool.name}</strong>.
                  </p>
                  <p className="font-medium text-foreground">
                    {t('ai.welcome_tool_can_help', 'I can help you:')}
                  </p>
                  <ul className="space-y-1 pl-4 rtl:pl-0 rtl:pr-4 list-disc text-muted-foreground">
                    {(isAr ? currentTool.capabilitiesAr : currentTool.capabilitiesEn)
                      .slice(0, 4)
                      .map((cap, idx) => (
                        <li key={idx}>{cap}</li>
                      ))}
                  </ul>
                  <p className="pt-1 text-foreground font-medium">
                    {t('ai.welcome_tool_question', 'What would you like to know?')}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t(
                    'ai.welcome_general_desc',
                    'I can help you find the right tool, understand how a tool works, or answer questions about DigitalMix.'
                  )}
                </p>
              )}
            </div>

            {/* Quick Suggested Prompt Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">
                {isAr ? 'أسئلة واقتراحات شائعة:' : 'Suggested Questions:'}
              </span>
              <div className="flex flex-col gap-1.5">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePromptClick(p)}
                    className="flex items-center justify-between p-2.5 rounded-lg text-start text-xs bg-muted/50 hover:bg-muted border border-border/50 text-foreground transition-all duration-150 hover:border-blue-500/30 group"
                  >
                    <span>{isAr ? p.textAr : p.textEn}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform shrink-0 ml-1.5 rtl:ml-0 rtl:mr-1.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Message List */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            } space-y-1`}
          >
            {/* Shared input snippet badge */}
            {msg.sharedInputSnippet && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{t('ai.shared_input_badge', 'Shared with AI for analysis')}</span>
              </div>
            )}

            <div
              className={`relative max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed text-xs sm:text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none rtl:rounded-br-2xl rtl:rounded-bl-none shadow-sm'
                  : 'bg-muted/80 text-foreground rounded-bl-none rtl:rounded-bl-2xl rtl:rounded-br-none border border-border/60'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-xs dark:prose-invert max-w-none text-xs sm:text-[13px] leading-relaxed break-words space-y-1.5 [&_ul]:list-disc [&_ul]:pl-4 rtl:[&_ul]:pl-0 rtl:[&_ul]:pr-4 [&_ol]:list-decimal [&_ol]:pl-4 rtl:[&_ol]:pl-0 rtl:[&_ol]:pr-4 [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-2.5 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_code]:bg-slate-800/60 [&_code]:text-blue-300 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px]">
                  <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              )}

              {/* Copy button for assistant */}
              {msg.role === 'assistant' && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                    title={isAr ? 'نسخ الإجابة' : 'Copy answer'}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Actionable Recommended Tool Cards */}
            {msg.toolRecommendations && msg.toolRecommendations.length > 0 && (
              <div className="w-full max-w-[92%] space-y-1.5 pt-1">
                {msg.toolRecommendations.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/80 hover:border-blue-500/40 shadow-sm transition-all duration-150"
                  >
                    <div className="min-w-0 pr-2 rtl:pr-0 rtl:pl-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {tool.name}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium shrink-0">
                          {isAr ? tool.categoryNameAr : tool.categoryNameEn}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {isAr ? tool.descriptionAr : tool.descriptionEn}
                      </p>
                    </div>
                    <Link
                      href={tool.href}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors shrink-0"
                    >
                      <span>{t('ai.open_tool', 'Open Tool')}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Privacy Confirmation Card when user opts to analyze input */}
        {showPrivacyConfirm && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground">
                  {t('ai.share_consent_title', 'Share input with AI?')}
                </h4>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  {t(
                    'ai.share_consent_desc',
                    'Your input from the current tool will be shared with AI for analysis. DigitalMix does not store this data.'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPrivacyConfirm(false)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                {t('ai.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmAnalysis}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
              >
                {t('ai.confirm_analyze', 'Analyze')}
              </button>
            </div>
          </div>
        )}

        {/* Loading / Typing Indicator */}
        {isLoading && (
          <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-muted/60 text-muted-foreground w-fit animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" />
            <span className="text-xs font-medium">{isAr ? 'جاري التحليل والكتابة...' : 'DigitalMix AI is thinking...'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer Area */}
      <div className="p-3 border-t border-border/60 bg-muted/20 space-y-2">
        {/* Optional "Analyze my current input" Button for code/text tools */}
        {currentTool?.supportsCodeAnalysis && !showPrivacyConfirm && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleRequestInputAnalysis}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
            >
              <Code className="w-3 h-3" />
              <span>{t('ai.share_analyze_btn', 'Analyze my current input')}</span>
            </button>
          </div>
        )}

        {/* Input box */}
        <div className="relative flex items-center gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('ai.input_placeholder', 'Ask a question or find a tool...')}
            className="ai-chat-input flex-1 min-h-[38px] max-h-[100px] resize-none px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-foreground placeholder:text-muted-foreground/60 transition-colors"
          />
          <button
            type="button"
            disabled={isLoading || !inputValue.trim()}
            onClick={() => handleSendMessage()}
            aria-label={t('ai.send', 'Send')}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white shadow-sm transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Send className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>

        {/* Shortcut and privacy caption */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
          <span className="hidden sm:inline">
            {t('ai.shortcut_hint', 'Enter to send • Shift+Enter for new line')}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground/80">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            {t('ai.privacy_badge', 'Privacy-First • In-Browser')}
          </span>
        </div>
      </div>
    </div>
  )
}
