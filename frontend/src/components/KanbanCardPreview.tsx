import type { Card } from "@/lib/kanban";
import { GripVertical } from "lucide-react";

type KanbanCardPreviewProps = {
  card: Card;
};

export const KanbanCardPreview = ({ card }: KanbanCardPreviewProps) => (
  <article className="rounded-xl border border-[var(--primary-blue)] bg-white p-3 shadow-[var(--shadow-lg)]">
    <div className="flex items-start gap-2">
      <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--gray-light)]" />
      <div className="min-w-0 flex-1">
        <h4 className="font-display text-sm font-semibold leading-snug text-[var(--navy-dark)]">
          {card.title}
        </h4>
        <p className="mt-1 text-xs leading-relaxed text-[var(--gray-text)] line-clamp-2">
          {card.details}
        </p>
      </div>
    </div>
  </article>
);
