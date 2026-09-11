import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface KanbanCard {
  id: string;
  title: string;
  subtitle?: string;
  assignee?: { name: string; avatarUrl?: string | null };
  tags?: string[];
  priority?: "low" | "medium" | "high" | "urgent";
  matchScore?: number;
  dueDate?: string;
  metadata?: Record<string, unknown>;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  bgColor: string;
  cards: KanbanCard[];
  limit?: number;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onCardClick?: (card: KanbanCard, columnId: string) => void;
  onCardMove?: (cardId: string, fromColumn: string, toColumn: string, newIndex: number) => void;
  onAddCard?: (columnId: string) => void;
  onColumnClick?: (columnId: string) => void;
  renderCard?: (card: KanbanCard, columnId: string) => React.ReactNode;
  dragEnabled?: boolean;
  className?: string;
}

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: "Low", color: "text-gray-500", bg: "bg-gray-100" },
  medium: { label: "Medium", color: "text-blue-600", bg: "bg-blue-100" },
  high: { label: "High", color: "text-orange-600", bg: "bg-orange-100" },
  urgent: { label: "Urgent", color: "text-red-600", bg: "bg-red-100" },
};

export function KanbanBoard({
  columns,
  onCardClick,
  onCardMove,
  onAddCard,
  onColumnClick,
  renderCard,
  dragEnabled = true,
  className,
}: KanbanBoardProps) {
  const [draggedCard, setDraggedCard] = useState<{ card: KanbanCard; columnId: string } | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback(
    (card: KanbanCard, columnId: string) => {
      if (!dragEnabled) return;
      setDraggedCard({ card, columnId });
    },
    [dragEnabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, columnId: string, index?: number) => {
      e.preventDefault();
      setDragOverColumn(columnId);
      if (index !== undefined) setDragOverIndex(index);
    },
    []
  );

  const handleDrop = useCallback(
    (targetColumnId: string) => {
      if (!draggedCard) return;
      if (draggedCard.columnId === targetColumnId) {
        setDraggedCard(null);
        setDragOverColumn(null);
        return;
      }
      const newIndex = dragOverIndex ?? 0;
      onCardMove?.(draggedCard.card.id, draggedCard.columnId, targetColumnId, newIndex);
      setDraggedCard(null);
      setDragOverColumn(null);
      setDragOverIndex(null);
    },
    [draggedCard, dragOverIndex, onCardMove]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedCard(null);
    setDragOverColumn(null);
    setDragOverIndex(null);
  }, []);

  return (
    <div
      ref={boardRef}
      className={cn("flex gap-4 overflow-x-auto pb-4 min-h-[500px]", className)}
    >
      {columns.map((column) => {
        const isOver = dragOverColumn === column.id;
        const atLimit = column.limit && column.cards.length >= column.limit;

        return (
          <div
            key={column.id}
            className={cn(
              "flex-shrink-0 w-72 flex flex-col rounded-2xl transition-colors",
              isOver ? "bg-blue-50/50" : "bg-gray-50/80"
            )}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={() => handleDrop(column.id)}
          >
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer"
              onClick={() => onColumnClick?.(column.id)}
            >
              <div className="flex items-center gap-2">
                <span className={cn("w-2.5 h-2.5 rounded-full", column.bgColor)} />
                <h3 className="text-sm font-bold text-gray-900">{column.title}</h3>
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-200 text-gray-600 rounded-full">
                  {column.cards.length}
                </span>
              </div>
              {onAddCard && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddCard(column.id);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5 min-h-[100px]">
              {column.cards.map((card, index) => (
                <div
                  key={card.id}
                  draggable={dragEnabled}
                  onDragStart={() => handleDragStart(card, column.id)}
                  onDragOver={(e) => handleDragOver(e, column.id, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "transition-all",
                    draggedCard?.card.id === card.id && "opacity-40 scale-95"
                  )}
                >
                  {renderCard ? (
                    renderCard(card, column.id)
                  ) : (
                    <KanbanDefaultCard
                      card={card}
                      columnColor={column.color}
                      onClick={() => onCardClick?.(card, column.id)}
                    />
                  )}
                </div>
              ))}

              {column.cards.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-xs text-gray-400">No items</p>
                </div>
              )}
            </div>

            {column.limit && (
              <div className="px-4 py-2 border-t border-gray-200/50">
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span>{column.cards.length}/{column.limit} items</span>
                  {atLimit && <span className="text-amber-500 font-medium">At limit</span>}
                </div>
                <div className="w-full h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      atLimit ? "bg-amber-500" : "bg-blue-500"
                    )}
                    style={{ width: `${Math.min((column.cards.length / column.limit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function KanbanDefaultCard({
  card,
  columnColor,
  onClick,
}: {
  card: KanbanCard;
  columnColor: string;
  onClick: () => void;
}) {
  const priority = card.priority ? priorityConfig[card.priority] : null;

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-gray-200 p-3.5 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 flex-1">
          {card.title}
        </h4>
        {priority && (
          <span className={cn("px-1.5 py-0.5 text-[9px] font-bold rounded-full flex-shrink-0 ml-2", priority.bg, priority.color)}>
            {priority.label}
          </span>
        )}
      </div>

      {card.subtitle && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-1">{card.subtitle}</p>
      )}

      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-1.5 py-0.5 text-[9px] font-medium bg-gray-100 text-gray-600 rounded-full">
              {tag}
            </span>
          ))}
          {card.tags.length > 3 && (
            <span className="px-1.5 py-0.5 text-[9px] font-medium bg-gray-100 text-gray-400 rounded-full">
              +{card.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {card.assignee && (
            <div className="flex items-center gap-1.5">
              {card.assignee.avatarUrl ? (
                <img src={card.assignee.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-[7px] font-bold">
                  {card.assignee.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
              )}
              <span className="text-[10px] text-gray-500">{card.assignee.name.split(" ")[0]}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {card.matchScore != null && (
            <span
              className={cn(
                "px-1.5 py-0.5 text-[9px] font-bold rounded-full",
                card.matchScore >= 80
                  ? "bg-emerald-100 text-emerald-700"
                  : card.matchScore >= 60
                  ? "bg-blue-100 text-blue-700"
                  : "bg-amber-100 text-amber-700"
              )}
            >
              {card.matchScore}%
            </span>
          )}
          {card.dueDate && (
            <span className="text-[10px] text-gray-400">
              {new Date(card.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center">
        <div className={cn("w-full h-0.5 rounded-full", columnColor)} />
      </div>
    </div>
  );
}

export default KanbanBoard;
