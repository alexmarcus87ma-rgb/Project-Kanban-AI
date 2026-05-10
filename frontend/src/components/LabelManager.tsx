"use client"

import { useState } from "react"
import { X, Plus, Pencil, Trash2, Check } from "lucide-react"
import { api } from "@/lib/api"

interface Label {
  id: number
  name: string
  color: string
}

interface LabelManagerProps {
  boardId: number
  labels: Label[]
  onClose: () => void
  onUpdate: () => void
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6",
  "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6", "#64748b",
]

export function LabelManager({ boardId, labels, onClose, onUpdate }: LabelManagerProps) {
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      await api.createLabel(boardId, { name: newName.trim(), color: newColor })
      setNewName("")
      setNewColor(PRESET_COLORS[0])
      onUpdate()
    } catch {
      // ignore
    }
  }

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return
    try {
      await api.updateLabel(boardId, id, { name: editName.trim(), color: editColor })
      setEditingId(null)
      onUpdate()
    } catch {
      // ignore
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.deleteLabel(boardId, id)
      onUpdate()
    } catch {
      // ignore
    }
  }

  const startEdit = (label: Label) => {
    setEditingId(label.id)
    setEditName(label.name)
    setEditColor(label.color)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="mx-4 w-full max-w-md rounded-2xl border border-[var(--stroke)] bg-white shadow-[var(--shadow-lg)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--stroke)] px-6 py-4">
          <h2 className="font-display text-lg font-bold text-[var(--navy-dark)]">
            Manage Labels
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--gray-text)] transition hover:bg-[var(--surface)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Label list */}
        <div className="max-h-[50vh] overflow-y-auto px-6 py-4 space-y-2">
          {labels.length === 0 && (
            <p className="text-center text-sm text-[var(--gray-text)] py-4">
              No labels yet. Create one below.
            </p>
          )}
          {labels.map((label) => (
            <div key={label.id} className="flex items-center gap-2 rounded-lg border border-[var(--stroke)] p-2">
              {editingId === label.id ? (
                <>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className="h-5 w-5 rounded-full border-2 transition"
                        style={{
                          backgroundColor: c,
                          borderColor: editColor === c ? "var(--navy-dark)" : "transparent",
                        }}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate(label.id)
                      if (e.key === "Escape") setEditingId(null)
                    }}
                    className="flex-1 rounded-lg border border-[var(--stroke)] px-2 py-1 text-sm outline-none focus:border-[var(--primary-blue)]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdate(label.id)}
                    className="rounded-lg p-1.5 text-green-600 hover:bg-green-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg p-1.5 text-[var(--gray-text)] hover:bg-[var(--surface)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="h-4 w-4 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="flex-1 text-sm font-medium text-[var(--navy-dark)]">
                    {label.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEdit(label)}
                    className="rounded-lg p-1.5 text-[var(--gray-text)] opacity-0 group-hover:opacity-100 hover:bg-[var(--surface)] hover:text-[var(--navy-dark)] transition [.flex:hover>&]:opacity-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(label.id)}
                    className="rounded-lg p-1.5 text-[var(--gray-text)] opacity-0 hover:bg-red-50 hover:text-red-500 transition [.flex:hover>&]:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Create new label */}
        <div className="border-t border-[var(--stroke)] px-6 py-4">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className="h-6 w-6 rounded-full border-2 transition"
                style={{
                  backgroundColor: c,
                  borderColor: newColor === c ? "var(--navy-dark)" : "transparent",
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate()
              }}
              placeholder="New label name"
              className="flex-1 rounded-xl border border-[var(--stroke)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--primary-blue)] focus:bg-white"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--primary-blue)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
