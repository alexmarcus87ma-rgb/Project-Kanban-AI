"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronDown, Check } from "lucide-react"
import { api } from "@/lib/api"

interface BoardInfo {
  id: number
  name: string
}

interface BoardSelectorProps {
  boards: BoardInfo[]
  activeBoardId: number | null
  onSelectBoard: (id: number) => void
  onBoardCreated: () => void
  onBoardDeleted: () => void
}

export function BoardSelector({
  boards,
  activeBoardId,
  onSelectBoard,
  onBoardCreated,
  onBoardDeleted,
}: BoardSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState("")

  const activeBoard = boards.find((b) => b.id === activeBoardId)

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      const board = await api.createBoard(newName.trim())
      setNewName("")
      setIsCreating(false)
      onBoardCreated()
      onSelectBoard(board.id)
    } catch {
      // ignore
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (boards.length <= 1) return
    try {
      await api.deleteBoard(id)
      onBoardDeleted()
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-medium text-[var(--navy-dark)] transition hover:border-[var(--stroke-hover)]"
      >
        <span className="max-w-[160px] truncate">{activeBoard?.name ?? "Select board"}</span>
        <ChevronDown className="h-4 w-4 text-[var(--gray-text)]" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-[var(--stroke)] bg-white shadow-[var(--shadow-lg)]">
          <div className="max-h-60 overflow-y-auto p-1">
            {boards.map((board) => (
              <button
                key={board.id}
                type="button"
                onClick={() => {
                  onSelectBoard(board.id)
                  setIsOpen(false)
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-[var(--navy-dark)] transition hover:bg-[var(--surface)]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {board.id === activeBoardId && (
                    <Check className="h-3.5 w-3.5 flex-shrink-0 text-[var(--primary-blue)]" />
                  )}
                  <span className="truncate">{board.name}</span>
                </div>
                {boards.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, board.id)}
                    className="flex-shrink-0 rounded p-1 text-[var(--gray-light)] opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 [button:hover>&]:opacity-100"
                    title="Delete board"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-[var(--stroke)] p-2">
            {isCreating ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate()
                    if (e.key === "Escape") setIsCreating(false)
                  }}
                  placeholder="Board name"
                  className="flex-1 rounded-lg border border-[var(--stroke)] px-2 py-1.5 text-sm outline-none focus:border-[var(--primary-blue)]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  className="rounded-lg bg-[var(--primary-blue)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--primary-blue)] transition hover:bg-[var(--surface)]"
              >
                <Plus className="h-4 w-4" />
                New board
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
