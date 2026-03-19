import { useMemo, useState } from 'react';
import { Task, TIME_ESTIMATES, UpdateTaskInput } from '@/hooks/useTasks';
import { useUser } from '@/contexts/UserContext';
import { GOOGLE_CALENDAR_COLORS } from '@/types/user';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Clock, GripVertical, Repeat, Flag, Calendar, Trash2, Edit2, Check, X, SkipForward } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';

interface DraggableTaskBlockProps {
  task: Task;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onUpdate?: (id: string, input: UpdateTaskInput) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  isDragging?: boolean;
  compact?: boolean;
}

const HOUR_HEIGHT = 48;

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

const priorityTextColors = {
  1: 'text-red-500',
  2: 'text-orange-500',
  3: 'text-yellow-500',
  4: 'text-blue-500',
};

export function DraggableTaskBlock({ 
  task, 
  onDragStart, 
  onDragEnd, 
  onUpdate,
  onDelete,
  isDragging = false,
  compact = false 
}: DraggableTaskBlockProps) {
  const { categories } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isDeleting, setIsDeleting] = useState(false);

  const taskAreas = useMemo(() => 
    (task.life_areas || []).map(area => {
      const cat = categories.find(c => c.name.toLowerCase() === area.toLowerCase());
      return cat ? { name: cat.name, colorId: cat.googleColorId } : { name: area, colorId: '1' };
    }),
    [task.life_areas, categories]
  );

  const timeEstimate = useMemo(() =>
    TIME_ESTIMATES.find(t => t.value === task.time_estimate_minutes),
    [task.time_estimate_minutes]
  );

  const blockHeight = useMemo(() => {
    if (!task.time_estimate_minutes) return 'auto';
    const hours = task.time_estimate_minutes / 60;
    return Math.max(hours * HOUR_HEIGHT, 36);
  }, [task.time_estimate_minutes]);

  const isRecurring = task.is_recurring;

  const handleSave = async () => {
    if (editTitle.trim() && onUpdate) {
      await onUpdate(task.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    await onDelete(task.id);
  };

  const handlePriorityChange = async (priority: number) => {
    if (onUpdate) {
      await onUpdate(task.id, { priority });
    }
  };

  const handleDateChange = async (date: Date | undefined) => {
    if (onUpdate) {
      await onUpdate(task.id, { due_date: date ? date.toISOString() : null });
    }
  };

  const handleTimeEstimateChange = async (minutes: number | null) => {
    if (onUpdate) {
      await onUpdate(task.id, { time_estimate_minutes: minutes });
    }
  };

  const handleSkip = async () => {
    if (!onUpdate) return;
    const newSkipCount = (task.skip_count || 0) + 1;
    await onUpdate(task.id, { skip_count: newSkipCount });
    
    if (newSkipCount >= 3) {
      toast.warning(`You've skipped "${task.title}" ${newSkipCount} times in a row. Consider adjusting your schedule or removing this task.`, {
        duration: 6000,
      });
    } else {
      toast.info(`Skipped "${task.title}" (${newSkipCount} skip${newSkipCount > 1 ? 's' : ''} in a row)`);
    }
  };

  if (isEditing) {
    return (
      <div className={cn(
        "rounded-lg border-l-4 bg-card shadow-sm p-2",
        priorityColors[task.priority as keyof typeof priorityColors] || 'border-l-muted'
      )}>
        <div className="flex items-center gap-2">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            className="flex-1 h-8 text-sm"
            autoFocus
          />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

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
        isDeleting && "opacity-50 pointer-events-none",
        compact ? "p-2" : "p-3"
      )}
      style={{ height: compact ? 'auto' : blockHeight }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {(onUpdate || onDelete) && (
        <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-card/90 rounded p-0.5">
          {onUpdate && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-6 w-6">
                    <Flag className={cn("h-3 w-3", priorityTextColors[task.priority as keyof typeof priorityTextColors])} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-2" align="end">
                  <div className="flex flex-col gap-1">
                    {[1, 2, 3, 4].map((p) => (
                      <Button
                        key={p}
                        size="sm"
                        variant={task.priority === p ? "secondary" : "ghost"}
                        className="justify-start h-7 text-xs"
                        onClick={() => handlePriorityChange(p)}
                      >
                        <Flag className={cn("h-3 w-3 mr-1", priorityTextColors[p as keyof typeof priorityTextColors])} />
                        {priorityLabels[p as keyof typeof priorityLabels]}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-6 w-6">
                    <Clock className={cn("h-3 w-3", task.time_estimate_minutes && "text-primary")} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-36 p-2" align="end">
                  <div className="flex flex-col gap-1">
                    {TIME_ESTIMATES.map((t) => (
                      <Button
                        key={t.value}
                        size="sm"
                        variant={task.time_estimate_minutes === t.value ? "secondary" : "ghost"}
                        className="justify-start h-7 text-xs"
                        onClick={() => handleTimeEstimateChange(t.value)}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {t.label}
                      </Button>
                    ))}
                    {task.time_estimate_minutes && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="justify-start h-7 text-xs text-muted-foreground"
                        onClick={() => handleTimeEstimateChange(null)}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-6 w-6">
                    <Calendar className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarPicker
                    mode="single"
                    selected={task.due_date ? parseISO(task.due_date) : undefined}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {task.is_recurring && task.recurrence_per_week && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSkip();
                  }}
                  title="Skip this instance"
                >
                  <SkipForward className="h-3 w-3" />
                </Button>
              )}

              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </>
          )}

          {onDelete && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      <div className={cn("flex flex-col gap-1", !compact && "pl-4")}>
        <div className="font-medium text-sm line-clamp-2 pr-20">{task.title}</div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {/* Life Area Badges */}
          {taskAreas.map(area => (
            <span 
              key={area.name}
              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-white text-[10px]"
              style={{ backgroundColor: GOOGLE_CALENDAR_COLORS[area.colorId]?.hex }}
            >
              {area.name}
            </span>
          ))}

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

          {timeEstimate && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeEstimate.label}
            </span>
          )}

          {isRecurring && (
            <span className="flex items-center gap-1 text-primary">
              <Repeat className="h-3 w-3" />
              {task.recurrence_per_week && <span>{task.recurrence_per_week}x/wk</span>}
            </span>
          )}

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
