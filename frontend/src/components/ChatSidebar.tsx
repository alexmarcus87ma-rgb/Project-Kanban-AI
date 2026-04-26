"use client"

import { useState, useEffect, useRef } from "react"
import { api } from "@/lib/api"

interface ChatSidebarProps {
  boardId: number | null
  isOpen: boolean
  onClose: () => void
}

type Message = { id: string; role: "user" | "assistant"; content: string }

export const ChatSidebar = ({ boardId, isOpen, onClose }: ChatSidebarProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !boardId || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      const data = await api.chat(boardId, input)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "-ai",
          role: "assistant",
          content: data.reply,
        },
      ])
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "-err",
          role: "assistant",
          content: e.message ?? "Something went wrong. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="w-[380px] h-screen sticky top-0 flex flex-col border-l border-[var(--stroke)] bg-white/80 backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-[var(--stroke)] px-6 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
            AI Assistant
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-[var(--navy-dark)]">
            Board Chat
          </p>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="flex-shrink-0 rounded-full p-2 transition hover:bg-[var(--surface)]"
          title="Close chat"
        >
          <svg
            className="h-5 w-5 text-[var(--gray-text)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-sm text-[var(--gray-text)]">
              Start a conversation with the AI assistant about your board.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-[var(--primary-blue)] text-white"
                  : "bg-white border border-[var(--stroke)] text-[var(--navy-dark)] shadow-sm"
              }`}
            >
              <p className="break-words whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 bg-white border border-[var(--stroke)] shadow-sm">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-[var(--gray-text)] animate-bounce" />
                <div className="h-2 w-2 rounded-full bg-[var(--gray-text)] animate-bounce [animation-delay:0.2s]" />
                <div className="h-2 w-2 rounded-full bg-[var(--gray-text)] animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-[var(--stroke)] bg-white/50 px-4 py-4">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={!boardId || isLoading}
            rows={3}
            className="flex-1 rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--primary-blue)] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!boardId || isLoading || !input.trim()}
            type="button"
            className="flex-shrink-0 rounded-full bg-[var(--secondary-purple)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
