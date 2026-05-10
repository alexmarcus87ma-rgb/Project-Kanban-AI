import clsx from "clsx";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Card, Column } from "@/lib/kanban";
import { KanbanCard } from "@/components/KanbanCard";
import { NewCardForm } from "@/components/NewCardForm";
import { GripVertical } from "lucide-react";

type KanbanColumnProps = {
  column: Column;
  cards: Card[];
  accentColor: string;
  onRename: (columnId: string, title: string) => void;
  onAddCard: (columnId: string, title: string, details: string) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
};

export const KanbanColumn = ({
  column,
  cards,
  accentColor,
  onRename,
  onAddCard,
  onDeleteCard,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <section
      ref={setNodeRef}
      className={clsx(
        "flex min-h-[480px] flex-col rounded-2xl border bg-white transition-all duration-200",
        isOver
          ? "border-[var(--primary-blue)] bg-blue-50/40 shadow-[var(--shadow-lg)]"
          : "border-[var(--stroke)] shadow-[var(--shadow-sm)]"
      )}
      data-testid={`column-${column.id}`}
    >
      {/* Column header */}
      <div className="flex items-center gap-3 border-b border-[var(--stroke)] px-4 py-3">
        <span
          className="h-3 w-3 flex-shrink-0 rounded-full"
          style={{ background: accentColor }}
        />
        <input
          value={column.title}
          onChange={(event) => onRename(column.id, event.target.value)}
          className="min-w-0 flex-1 bg-transparent font-display text-sm font-bold text-[var(--navy-dark)] outline-none"
          aria-label="Column title"
        />
        <span className="flex-shrink-0 rounded-md bg-[var(--surface)] px-2 py-0.5 text-xs font-semibold text-[var(--gray-text)]">
          {cards.length}
        </span>
      </div>

      {/* Cards list */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onDelete={(cardId) => onDeleteCard(column.id, cardId)}
            />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className={clsx(
            "flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-8 text-center transition-all",
            isOver
              ? "border-[var(--primary-blue)] bg-blue-50/60 text-[var(--primary-blue)]"
              : "border-[var(--stroke)] text-[var(--gray-light)]"
          )}>
            <GripVertical className="h-5 w-5" />
            <span className="text-xs font-medium">Drop a card here</span>
          </div>
        )}
      </div>

      {/* Add card */}
      <div className="border-t border-[var(--stroke)] p-3">
        <NewCardForm
          onAdd={(title, details) => onAddCard(column.id, title, details)}
        />
      </div>
    </section>
  );
};
