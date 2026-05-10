"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
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
import { BoardSelector } from "@/components/BoardSelector"
import { moveCard, type BoardData, type Card, type Column, type CardLabel } from "@/lib/kanban"
import { api } from "@/lib/api"
import {
  LayoutDashboard,
  MessageSquare,
  LogOut,
  Loader2,
  X,
} from "lucide-react"

interface KanbanBoardProps {
  onLogout?: () => void
}

interface RawLabel {
  id: number
  board_id: number
  name: string
  color: string
}

interface RawCard {
  id: number
  column_id: number
  title: string
  description: string | null
  priority: string | null
  due_date: string | null
  labels: RawLabel[]
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
  labels: RawLabel[]
}

interface BoardListItem {
  id: number
  name: string
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
        priority: c.priority ?? undefined,
        dueDate: c.due_date ?? undefined,
        labels: c.labels?.map((l: RawLabel): CardLabel => ({
          id: l.id,
          name: l.name,
          color: l.color,
        })) ?? [],
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

const COLUMN_COLORS = [
  "var(--gray-light)",
  "var(--primary-blue)",
  "var(--accent-yellow)",
  "var(--accent-orange)",
  "var(--accent-green)",
]

export const KanbanBoard = ({ onLogout }: KanbanBoardProps) => {
  const [board, setBoard] = useState<BoardData>({ columns: [], cards: {} })
  const [boardId, setBoardId] = useState<number | null>(null)
  const [boards, setBoards] = useState<BoardListItem[]>([])
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  )

  const cardsById = useMemo(() => board.cards, [board.cards])

  const loadBoards = useCallback(async () => {
    try {
      const list = await api.getBoards()
      setBoards(list)
      return list
    } catch {
      return []
    }
  }, [])

  const loadBoard = useCallback(async (id?: number) => {
    const targetId = id ?? boardId
    if (!targetId) return
    try {
      const raw = await api.getBoard(targetId)
      const { data } = transformBoard(raw)
      setBoard(data)
      setBoardId(targetId)
    } catch (e) {
      console.error("Failed to load board:", e)
    }
  }, [boardId])

  // Initial load
  useEffect(() => {
    api
      .getBoards()
      .then((list: BoardListItem[]) => {
        setBoards(list)
        if (list.length === 0) throw new Error("No boards found")
        return api.getBoard(list[0].id)
      })
      .then((raw: RawBoard) => {
        const { boardId: bid, data } = transformBoard(raw)
        setBoardId(bid)
        setBoard(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  const handleSelectBoard = async (id: number) => {
    setLoading(true)
    await loadBoard(id)
    setLoading(false)
  }

  const handleBoardCreated = async () => {
    await loadBoards()
  }

  const handleBoardDeleted = async () => {
    const list = await loadBoards()
    if (list.length > 0) {
      const stillExists = list.find((b: BoardListItem) => b.id === boardId)
      if (!stillExists) {
        await handleSelectBoard(list[0].id)
      }
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCardId(null)

    if (!over) return

    const draggedCardId = active.id as string
    const overId = over.id as string

    const currentColumn = board.columns.find((col) =>
      col.cardIds.includes(draggedCardId)
    )
    let targetColumn = board.columns.find((col) => col.id === overId)
    if (!targetColumn) {
      targetColumn = board.columns.find((col) =>
        col.cardIds.includes(overId)
      )
    }

    if (!currentColumn || !targetColumn) return
    if (currentColumn.id === targetColumn.id && draggedCardId === overId) return

    const newColumns = moveCard(board.columns, draggedCardId, overId)
    setBoard((prev) => ({ ...prev, columns: newColumns }))

    const newPosition = newColumns
      .find((col) => col.id === targetColumn!.id)
      ?.cardIds.indexOf(draggedCardId) ?? 0

    try {
      await api.updateCard(parseInt(draggedCardId), {
        column_id: parseInt(targetColumn.id),
        position: newPosition,
      })
    } catch {
      if (boardId) loadBoard()
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
      // Silently fail
    }
  }

  const handleAddCard = async (
    columnId: string,
    title: string,
    details: string
  ) => {
    if (!boardId) return

    const tempId = `temp-${Date.now()}`
    setBoard((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [tempId]: {
          id: tempId,
          title,
          details: details || "No details yet.",
          labels: [],
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
              priority: response.priority ?? undefined,
              dueDate: response.due_date ?? undefined,
              labels: response.labels ?? [],
            },
          },
          columns: prev.columns.map((column) => ({
            ...column,
            cardIds: column.cardIds.map((id) => (id === tempId ? realId : id)),
          })),
        }
      })
    } catch {
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
    setBoard((prev) => {
      const { [cardId]: _, ...restCards } = prev.cards
      return {
        ...prev,
        cards: restCards,
        columns: prev.columns.map((column) =>
          column.id === columnId
            ? { ...column, cardIds: column.cardIds.filter((id) => id !== cardId) }
            : column
        ),
      }
    })

    try {
      await api.deleteCard(parseInt(cardId))
    } catch {
      if (boardId) loadBoard()
    }
  }

  const activeCard = activeCardId ? cardsById[activeCardId] : null
  const totalCards = Object.keys(board.cards).length

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary-blue)]" />
          <p className="text-sm font-medium text-[var(--gray-text)]">Loading your board...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-screen overflow-hidden">
      <div className="relative flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        <main className="relative mx-auto flex min-h-full max-w-[1600px] flex-col gap-6 px-6 py-6 2xl:px-8">
          {/* Header */}
          <header className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--stroke)] bg-white px-6 py-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--secondary-purple)] text-white">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-[var(--navy-dark)]">
                  Kanban Studio
                </h1>
                <p className="text-xs text-[var(--gray-text)]">
                  {board.columns.length} columns &middot; {totalCards} cards
                </p>
              </div>
              <BoardSelector
                boards={boards}
                activeBoardId={boardId}
                onSelectBoard={handleSelectBoard}
                onBoardCreated={handleBoardCreated}
                onBoardDeleted={handleBoardDeleted}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setChatOpen((o) => !o)}
                type="button"
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  chatOpen
                    ? "bg-[var(--primary-blue)] text-white shadow-[var(--shadow-sm)]"
                    : "text-[var(--gray-text)] hover:bg-[var(--surface)] hover:text-[var(--navy-dark)]"
                }`}
              >
                {chatOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{chatOpen ? "Close Chat" : "AI Chat"}</span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  type="button"
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--gray-text)] transition hover:bg-red-50 hover:text-red-600"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              )}
            </div>
          </header>

          {/* Column tags */}
          <div className="flex flex-wrap items-center gap-2">
            {board.columns.map((column, index) => (
              <div
                key={column.id}
                className="flex items-center gap-2 rounded-lg border border-[var(--stroke)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--navy-dark)]"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: COLUMN_COLORS[index % COLUMN_COLORS.length] }}
                />
                {column.title}
                <span className="ml-1 text-[var(--gray-text)]">{column.cardIds.length}</span>
              </div>
            ))}
          </div>

          {/* Kanban Grid */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <section className="grid flex-1 auto-rows-min gap-4" style={{
              gridTemplateColumns: `repeat(${Math.min(board.columns.length, 6)}, minmax(0, 1fr))`
            }}>
              {board.columns.map((column, index) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  cards={column.cardIds.map((cardId) => board.cards[cardId]).filter(Boolean)}
                  accentColor={COLUMN_COLORS[index % COLUMN_COLORS.length]}
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
          onBoardUpdate={() => loadBoard()}
        />
      )}
    </div>
  )
}
