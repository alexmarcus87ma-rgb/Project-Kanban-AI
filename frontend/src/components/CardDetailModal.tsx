"use client"

import { useState, useEffect } from "react"
import { X, Clock, Tag, AlertTriangle, Save, Trash2 } from "lucide-react"
import type { Card, CardLabel } from "@/lib/kanban"
import clsx from "clsx"

interface CardDetailModalProps {
  card: Card
  columnName: string
  boardLabels: { id: number; name: string; color: string }[]
  onSave: (cardId: string, updates: {
    title?: string
    description?: string
    priority?: string | null
    due_date?: string | null
    label_ids?: number[]
  }) => Promise<void>
  onDelete: (cardId: string) => void
  onClose: () => void
}

const PRIORITIES = [
  { value: "", label: "None", style: "bg-gray-100 text-gray-600" },
  { value: "low", label: "Low", style: "bg-blue-100 text-blue-700" },
  { value: "medium", label: "Medium", style: "bg-yellow-100 text-yellow-700" },
  { value: "high", label: "High", style: "bg-orange-100 text-orange-700" },
  { value: "urgent", label: "Urgent", style: "bg-red-100 text-red-700" },
]

export function CardDetailModal({
  card,
  columnName,
  boardLabels,
  onSave,
  onDelete,
  onClose,
}: CardDetailModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.details === "No details yet." ? "" : card.details)
  const [priority, setPriority] = useState(card.priority ?? "")
  const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.split("T")[0] : "")
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(
    card.labels.map((l) => l.id)
  )
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [onClose])

  // Track changes
  useEffect(() => {
    const origLabels = card.labels.map((l) => l.id).sort().join(",")
    const newLabels = [...selectedLabelIds].sort().join(",")
    const changed =
      title !== card.title ||
      description !== (card.details === "No details yet." ? "" : card.details) ||
      priority !== (card.priority ?? "") ||
      dueDate !== (card.dueDate ? card.dueDate.split("T")[0] : "") ||
      origLabels !== newLabels
    setDirty(changed)
  }, [title, description, priority, dueDate, selectedLabelIds, card])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave(card.id, {
        title: title.trim(),
        description: description.trim() || "",
        priority: priority || null,
        due_date: dueDate || null,
        label_ids: selectedLabelIds,
      })
      onClose()
    } catch {
      // stay open on error
    } finally {
      setSaving(false)
    }
  }

  const toggleLabel = (labelId: number) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    )
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative mx-4 w-full max-w-lg rounded-2xl border border-[var(--stroke)] bg-white shadow-[var(--shadow-lg)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--stroke)] px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-[var(--gray-text)]">
            <span className="rounded-md bg-[var(--surface)] px-2 py-0.5 font-medium">
              {columnName}
            </span>
            <span>Card #{card.id}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--gray-text)] transition hover:bg-[var(--surface)] hover:text-[var(--navy-dark)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--gray-text)] uppercase tracking-wider">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-2.5 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)] focus:bg-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--gray-text)] uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Add details about this card..."
              className="w-full resize-none rounded-xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)] focus:bg-white placeholder:text-[var(--gray-light)]"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--gray-text)] uppercase tracking-wider">
              <AlertTriangle className="h-3 w-3" />
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={clsx(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    priority === p.value
                      ? `${p.style} ring-2 ring-offset-1 ring-current`
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--gray-text)] uppercase tracking-wider">
              <Clock className="h-3 w-3" />
              Due Date
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 rounded-xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)] focus:bg-white"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate("")}
                  className="rounded-lg p-2 text-[var(--gray-text)] hover:bg-red-50 hover:text-red-500 transition"
                  title="Clear due date"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Labels */}
          {boardLabels.length > 0 && (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--gray-text)] uppercase tracking-wider">
                <Tag className="h-3 w-3" />
                Labels
              </label>
              <div className="flex flex-wrap gap-2">
                {boardLabels.map((label) => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => toggleLabel(label.id)}
                    className={clsx(
                      "rounded-full px-3 py-1 text-xs font-medium transition",
                      selectedLabelIds.includes(label.id)
                        ? "text-white ring-2 ring-offset-1"
                        : "opacity-40 hover:opacity-70"
                    )}
                    style={{
                      backgroundColor: label.color,
                      ...(selectedLabelIds.includes(label.id)
                        ? { ringColor: label.color }
                        : {}),
                    }}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--stroke)] px-6 py-4">
          <button
            type="button"
            onClick={() => {
              onDelete(card.id)
              onClose()
            }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-[var(--gray-text)] transition hover:bg-[var(--surface)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving || !title.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--primary-blue)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
