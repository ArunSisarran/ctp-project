"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, Send, X, Bot, Sparkles } from "lucide-react"
import type { CountryStats } from "@/data/country-data"

interface ChatWidgetProps {
  countryData: CountryStats | null
}

interface Message {
  role: 'user' | 'bot'
  text: string
}

// Pre-made questions for quick access
const SUGGESTIONS = [
  "What is the #1 research field?",
  "What makes this country unique?",
  "Summarize the trends",
  "Any notable recent papers?",
]

export default function ChatWidget({ countryData }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: "Hi! Click a country and ask me about its research." }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen])


  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input
    if (!textToSend.trim()) return

    // Clear input immediately
    setInput("")
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: textToSend }])
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: textToSend, 
          countryData: countryData 
        })
      })
      
      const data = await res.json()
      
      if (data.response) {
        setMessages(prev => [...prev, { role: 'bot', text: data.response }])
      } else {
        throw new Error("No response")
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "Connection error. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start">
      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="mb-4 h-[500px] w-[350px] flex flex-col overflow-hidden rounded-xl border border-slate-700 bg-black/90 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900/50 p-4 shrink-0">
            <div className="flex items-center gap-2 text-cyan-400">
              <Bot className="h-5 w-5" />
              <span className="font-semibold text-white">Research AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-gray-200'
                  }`}
                >
                    <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-lg bg-slate-800 px-4 py-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 delay-100"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* SUGGESTION CHIPS (New Section) */}
          <div className="border-t border-slate-800 bg-slate-900/30 p-2">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {SUGGESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  disabled={isLoading}
                  className="whitespace-nowrap rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs text-cyan-200 transition-colors hover:bg-cyan-900/30 hover:border-cyan-500/50 hover:text-cyan-100 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask specific questions..."
                className="flex-1 rounded-md border border-slate-700 bg-black/50 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none placeholder:text-slate-500"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading}
                className="rounded-md bg-cyan-600 p-2 text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOGGLE BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-cyan-500"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>
    </div>
  )
}
