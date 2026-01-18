import { useMemo } from 'react';
import { Task, LIFE_AREAS, TIME_ESTIMATES } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Clock, GripVertical, Repeat, Flag, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface DraggableTaskBlockProps {
  task: Task;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  compact?: boolean;
}

const HOUR_HEIGHT = 48; // Match the calendar hour height

// Priority colors
const priorityColors = {
  1: 'border-l-red-500',
  2: 'border-l-orange-500',
  3: 'border-l-yellow-500',
  4: 'border-l-blue-500',
};

const priorityLabels = {
  1: 'Urgent',
  2: 'High',
  3: 'Medium',
  4: 'Low',
};

export function DraggableTaskBlock({ 
  task, 
  onDragStart, 
  onDragEnd, 
  isDragging = false,
  compact = false 
}: DraggableTaskBlockProps) {
  const lifeArea = useMemo(() => 
    LIFE_AREAS.find(a => a.value === task.life_area),
    [task.life_area]
  );

  const timeEstimate = useMemo(() =>
    TIME_ESTIMATES.find(t => t.value === task.time_estimate_minutes),
    [task.time_estimate_minutes]
  );

  // Calculate height based on time estimate (min 24px, proportional to hours)
  const blockHeight = useMemo(() => {
    if (!task.time_estimate_minutes) return 'auto';
    const hours = task.time_estimate_minutes / 60;
    return Math.max(hours * HOUR_HEIGHT, 36); // Minimum 36px
  }, [task.time_estimate_minutes]);

  const isRecurring = task.labels?.includes('recurring');

  return (
    <motion.div
      draggable
      onDragStart={(e) => onDragStart?.(e as unknown as React.DragEvent, task)}
      onDragEnd={(e) => onDragEnd?.(e as unknown as React.DragEvent)}
      className={cn(
        "group relative rounded-lg border-l-4 bg-card shadow-sm cursor-grab active:cursor-grabbing transition-all",
        "hover:shadow-md hover:scale-[1.02]",
        priorityColors[task.priority as keyof typeof priorityColors] || 'border-l-muted',
        isDragging && "opacity-50 scale-95",
        compact ? "p-2" : "p-3"
      )}
      style={{ height: compact ? 'auto' : blockHeight }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Drag handle */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className={cn("flex flex-col gap-1", !compact && "pl-4")}>
        {/* Title */}
        <div className="font-medium text-sm line-clamp-2">{task.title}</div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {/* Life Area Badge */}
          {lifeArea && (
            <span className={cn(
              "inline-flex items-center px-1.5 py-0.5 rounded-full text-white",
              lifeArea.color
            )}>
              {lifeArea.label}
            </span>
          )}

          {/* Priority Badge */}
          <span className="flex items-center gap-1">
            <Flag className={cn(
              "h-3 w-3",
              task.priority === 1 && "text-red-500",
              task.priority === 2 && "text-orange-500",
              task.priority === 3 && "text-yellow-500",
              task.priority === 4 && "text-blue-500"
            )} />
            <span className="hidden sm:inline">
              {priorityLabels[task.priority as keyof typeof priorityLabels]}
            </span>
          </span>

          {/* Time Estimate */}
          {timeEstimate && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeEstimate.label}
            </span>
          )}

          {/* Recurring indicator */}
          {isRecurring && (
            <span className="flex items-center gap-1 text-primary">
              <Repeat className="h-3 w-3" />
            </span>
          )}

          {/* Due date */}
          {task.due_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(parseISO(task.due_date), 'MMM d')}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
