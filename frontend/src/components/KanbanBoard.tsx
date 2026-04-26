"use client"

import { useMemo, useState, useEffect } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { KanbanColumn } from "@/components/KanbanColumn"
import { KanbanCardPreview } from "@/components/KanbanCardPreview"
import { ChatSidebar } from "@/components/ChatSidebar"
import { moveCard, type BoardData, type Card, type Column } from "@/lib/kanban"
import { api } from "@/lib/api"

interface KanbanBoardProps {
  onLogout?: () => void
}

interface RawCard {
  id: number
  column_id: number
  title: string
  description: string | null
}

interface RawColumn {
  id: number
  board_id: number
  name: string
  position: number
  cards: RawCard[]
}

interface RawBoard {
  id: number
  user_id: number
  name: string
  columns: RawColumn[]
}

function transformBoard(raw: RawBoard): { boardId: number; data: BoardData } {
  const cards: Record<string, Card> = {}
  const columns: Column[] = raw.columns.map((col) => {
    const cardIds = col.cards.map((c) => {
      const cardId = String(c.id)
      cards[cardId] = {
        id: cardId,
        title: c.title,
        details: c.description || "No details yet.",
      }
      return cardId
    })
    return {
      id: String(col.id),
      title: col.name,
      cardIds,
    }
  })
  return {
    boardId: raw.id,
    data: { columns, cards },
  }
}

export const KanbanBoard = ({ onLogout }: KanbanBoardProps) => {
  const [board, setBoard] = useState<BoardData>({ columns: [], cards: {} })
  const [boardId, setBoardId] = useState<number | null>(null)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  )

  const cardsById = useMemo(() => board.cards, [board.cards])

  // Fetch board on mount
  useEffect(() => {
    api
      .getBoards()
      .then((boards: any[]) => {
        if (boards.length === 0) throw new Error("No boards found")
        return api.getBoard(boards[0].id)
      })
      .then((raw: RawBoard) => {
        const { boardId, data } = transformBoard(raw)
        setBoardId(boardId)
        setBoard(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCardId(null)

    if (!over || active.id === over.id) {
      return
    }

    const newColumns = moveCard(
      board.columns,
      active.id as string,
      over.id as string
    )
    setBoard((prev) => ({
      ...prev,
      columns: newColumns,
    }))

    // Find new column and position for the dragged card
    const targetCol = newColumns.find((col) =>
      col.cardIds.includes(active.id as string)
    )
    if (targetCol) {
      const position = targetCol.cardIds.indexOf(active.id as string)
      try {
        await api.updateCard(parseInt(active.id as string), {
          column_id: parseInt(targetCol.id),
          position,
        })
      } catch {
        // Silently fail on drag updates, UI is already updated
      }
    }
  }

  const handleRenameColumn = async (columnId: string, title: string) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((column) =>
        column.id === columnId ? { ...column, title } : column
      ),
    }))

    try {
      await api.updateColumn(parseInt(columnId), { name: title })
    } catch {
      // Silently fail, UI is already updated
    }
  }

  const handleAddCard = async (
    columnId: string,
    title: string,
    details: string
  ) => {
    if (!boardId) return

    // Optimistic update with temporary string ID
    const tempId = `temp-${Date.now()}`
    setBoard((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [tempId]: {
          id: tempId,
          title,
          details: details || "No details yet.",
        },
      },
      columns: prev.columns.map((column) =>
        column.id === columnId
          ? { ...column, cardIds: [...column.cardIds, tempId] }
          : column
      ),
    }))

    try {
      const response = await api.createCard(boardId, {
        column_id: parseInt(columnId),
        title,
        description: details,
      })

      // Replace temp ID with real ID from server
      const realId = String(response.id)
      setBoard((prev) => {
        const { [tempId]: _, ...restCards } = prev.cards
        return {
          ...prev,
          cards: {
            ...restCards,
            [realId]: {
              id: realId,
              title: response.title,
              details: response.description || "No details yet.",
            },
          },
          columns: prev.columns.map((column) => ({
            ...column,
            cardIds: column.cardIds.map((id) => (id === tempId ? realId : id)),
          })),
        }
      })
    } catch {
      // Remove optimistic update on error
      setBoard((prev) => {
        const { [tempId]: _, ...restCards } = prev.cards
        return {
          ...prev,
          cards: restCards,
          columns: prev.columns.map((column) => ({
            ...column,
            cardIds: column.cardIds.filter((id) => id !== tempId),
          })),
        }
      })
    }
  }

  const handleDeleteCard = async (columnId: string, cardId: string) => {
    // Optimistic update
    setBoard((prev) => {
      const { [cardId]: _, ...restCards } = prev.cards
      return {
        ...prev,
        cards: restCards,
        columns: prev.columns.map((column) =>
          column.id === columnId
            ? {
                ...column,
                cardIds: column.cardIds.filter((id) => id !== cardId),
              }
            : column
        ),
      }
    })

    try {
      await api.deleteCard(parseInt(cardId))
    } catch {
      // On error, re-fetch the board to restore state
      if (boardId) {
        const raw = await api.getBoard(boardId)
        const { data } = transformBoard(raw)
        setBoard(data)
      }
    }
  }

  const activeCard = activeCardId ? cardsById[activeCardId] : null

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full border-4 border-[var(--stroke)] border-t-[var(--primary-blue)]"></div>
          <p className="mt-4 text-sm text-[var(--gray-text)]">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex overflow-hidden">
      <div className="relative flex-1 min-w-0 overflow-hidden">
        <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]" />

        <main className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col gap-10 px-6 pb-16 pt-12">
        <header className="flex flex-col gap-6 rounded-[32px] border border-[var(--stroke)] bg-white/80 p-8 shadow-[var(--shadow)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
                Single Board Kanban
              </p>
              <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--navy-dark)]">
                Kanban Studio
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--gray-text)]">
                Keep momentum visible. Rename columns, drag cards between stages,
                and capture quick notes without getting buried in settings.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gray-text)]">
                Focus
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--primary-blue)]">
                One board. Five columns. Zero clutter.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setChatOpen((o) => !o)}
                type="button"
                className="rounded-full border border-[var(--stroke)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)] transition hover:border-[var(--primary-blue)] hover:text-[var(--navy-dark)]"
              >
                {chatOpen ? "Close AI" : "AI Chat"}
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  type="button"
                  className="rounded-full border border-[var(--stroke)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)] transition hover:border-[var(--primary-blue)] hover:text-[var(--navy-dark)]"
                >
                  Log out
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {board.columns.map((column) => (
              <div
                key={column.id}
                className="flex items-center gap-2 rounded-full border border-[var(--stroke)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy-dark)]"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--accent-yellow)]" />
                {column.title}
              </div>
            ))}
          </div>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <section className="grid gap-6 lg:grid-cols-5">
            {board.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={column.cardIds.map((cardId) => board.cards[cardId])}
                onRename={handleRenameColumn}
                onAddCard={handleAddCard}
                onDeleteCard={handleDeleteCard}
              />
            ))}
          </section>
          <DragOverlay>
            {activeCard ? (
              <div className="w-[260px]">
                <KanbanCardPreview card={activeCard} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
      </div>
      {chatOpen && boardId && (
        <ChatSidebar
          boardId={boardId}
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  )
}
