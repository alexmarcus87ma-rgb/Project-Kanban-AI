"use client"

import { useState, useEffect, useRef } from "react"
import { api } from "@/lib/api"
import { X, Send, Bot, User, Sparkles } from "lucide-react"

interface ChatSidebarProps {
  boardId: number | null
  isOpen: boolean
  onClose: () => void
  onBoardUpdate?: () => Promise<void> // Callback to refresh board when AI makes changes
}

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  actionCount?: number // Show if AI executed actions
  boardUpdated?: boolean
}

export const ChatSidebar = ({
  boardId,
  isOpen,
  onClose,
  onBoardUpdate,
}: ChatSidebarProps) => {
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

      // Check if AI made board changes
      const boardUpdated = data.board_updated || false
      const actionCount = data.actions_executed || 0

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "-ai",
          role: "assistant",
          content: data.reply,
          actionCount,
          boardUpdated,
        },
      ])

      // Refresh board if AI made changes
      if (boardUpdated && onBoardUpdate) {
        try {
          await onBoardUpdate()
        } catch (e) {
          console.error("Failed to refresh board:", e)
        }
      }
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
    <div className="w-[360px] h-screen sticky top-0 flex flex-col border-l border-[var(--stroke)] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--stroke)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--secondary-purple)]/10">
            <Bot className="h-4 w-4 text-[var(--secondary-purple)]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--navy-dark)]">AI Assistant</p>
            <p className="text-[11px] text-[var(--gray-text)]">Board Chat</p>
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="rounded-lg p-1.5 text-[var(--gray-text)] transition hover:bg-[var(--surface)] hover:text-[var(--navy-dark)]"
          title="Close chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface)]">
              <Bot className="h-6 w-6 text-[var(--gray-light)]" />
            </div>
            <p className="text-sm font-medium text-[var(--gray-text)]">
              Ask me anything about your board
            </p>
            <p className="text-xs text-[var(--gray-light)]">
              I can help manage tasks, move cards, and answer questions.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div className={`flex-shrink-0 mt-1 flex h-6 w-6 items-center justify-center rounded-md ${
              msg.role === "user"
                ? "bg-[var(--primary-blue)]/10"
                : "bg-[var(--secondary-purple)]/10"
            }`}>
              {msg.role === "user" ? (
                <User className="h-3.5 w-3.5 text-[var(--primary-blue)]" />
              ) : (
                <Bot className="h-3.5 w-3.5 text-[var(--secondary-purple)]" />
              )}
            </div>
            <div className="flex flex-col max-w-[260px]">
              <div
                className={`rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[var(--primary-blue)] text-white"
                    : "bg-[var(--surface)] text-[var(--navy-dark)] border border-[var(--stroke)]"
                }`}
              >
                <p className="break-words whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.boardUpdated && (
                <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-[var(--accent-yellow)]">
                  <Sparkles className="h-3 w-3" />
                  Board updated ({msg.actionCount} action{msg.actionCount !== 1 ? "s" : ""})
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2">
            <div className="flex-shrink-0 mt-1 flex h-6 w-6 items-center justify-center rounded-md bg-[var(--secondary-purple)]/10">
              <Bot className="h-3.5 w-3.5 text-[var(--secondary-purple)]" />
            </div>
            <div className="rounded-xl px-3 py-2.5 bg-[var(--surface)] border border-[var(--stroke)]">
              <div className="flex gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--gray-light)] animate-bounce" />
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--gray-light)] animate-bounce [animation-delay:0.2s]" />
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--gray-light)] animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-[var(--stroke)] p-4">
        <div className="flex items-end gap-2 rounded-xl border border-[var(--stroke)] bg-[var(--surface)] p-2 transition-colors focus-within:border-[var(--primary-blue)] focus-within:bg-white">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            disabled={!boardId || isLoading}
            rows={2}
            className="flex-1 resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-[var(--gray-light)] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!boardId || isLoading || !input.trim()}
            type="button"
            className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--secondary-purple)] text-white transition hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
