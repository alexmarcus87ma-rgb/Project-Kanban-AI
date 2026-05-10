import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Card } from "@/lib/kanban";
import { Trash2, GripVertical, Clock, AlertTriangle } from "lucide-react";

type KanbanCardProps = {
  card: Card;
  onDelete: (cardId: string) => void;
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-blue-100 text-blue-700",
};

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isDueOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

export const KanbanCard = ({ card, onDelete }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group relative rounded-xl border bg-white p-3 shadow-[var(--shadow-card)]",
        "transition-all duration-150",
        "hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--stroke-hover)]",
        isDragging
          ? "opacity-50 shadow-[var(--shadow-lg)] border-[var(--primary-blue)] cursor-grabbing"
          : "border-[var(--stroke)] cursor-grab"
      )}
      {...attributes}
      {...listeners}
      data-testid={`card-${card.id}`}
    >
      {/* Labels */}
      {card.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {card.labels.map((label) => (
            <span
              key={label.id}
              className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--gray-light)] opacity-0 transition group-hover:opacity-100" />
        <div className="min-w-0 flex-1">
          <h4 className="font-display text-sm font-semibold leading-snug text-[var(--navy-dark)]">
            {card.title}
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-[var(--gray-text)] line-clamp-2">
            {card.details}
          </p>

          {/* Priority & Due Date row */}
          {(card.priority || card.dueDate) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {card.priority && (
                <span
                  className={clsx(
                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                    PRIORITY_STYLES[card.priority] ?? "bg-gray-100 text-gray-600"
                  )}
                >
                  {card.priority === "urgent" && <AlertTriangle className="h-2.5 w-2.5" />}
                  {card.priority.charAt(0).toUpperCase() + card.priority.slice(1)}
                </span>
              )}
              {card.dueDate && (
                <span
                  className={clsx(
                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                    isDueOverdue(card.dueDate)
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  <Clock className="h-2.5 w-2.5" />
                  {formatDueDate(card.dueDate)}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card.id);
          }}
          className="flex-shrink-0 rounded-lg p-1.5 text-[var(--gray-light)] opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
          aria-label={`Delete ${card.title}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
};
