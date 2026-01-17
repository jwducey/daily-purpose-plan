import { useState } from 'react';
import { Task, UpdateTaskInput } from '@/hooks/useTasks';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Flag, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  GripVertical
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => Promise<boolean>;
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const priorityColors: Record<number, string> = {
  1: 'text-red-500',
  2: 'text-orange-500',
  3: 'text-blue-500',
  4: 'text-muted-foreground',
};

const priorityLabels: Record<number, string> = {
  1: 'P1',
  2: 'P2',
  3: 'P3',
  4: 'P4',
};

export function TaskItem({ task, onToggleComplete, onUpdate, onDelete }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (editTitle.trim()) {
      await onUpdate(task.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(task.id);
  };

  const handlePriorityChange = async (priority: number) => {
    await onUpdate(task.id, { priority });
  };

  const handleDateChange = async (date: Date | undefined) => {
    await onUpdate(task.id, { 
      due_date: date ? date.toISOString() : null 
    });
  };

  const formatDueDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) && !task.completed;

  return (
    <div 
      className={cn(
        "group flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors",
        task.completed && "opacity-60",
        isDeleting && "opacity-50 pointer-events-none"
      )}
    >
      <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggleComplete(task.id)}
        className="mt-0.5"
      />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              className="flex-1"
              autoFocus
            />
            <Button size="icon" variant="ghost" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <p 
              className={cn(
                "text-sm font-medium cursor-pointer",
                task.completed && "line-through text-muted-foreground"
              )}
              onClick={() => setIsEditing(true)}
            >
              {task.title}
            </p>
            
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {task.due_date && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    isOverdue && "text-red-500 border-red-500"
                  )}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDueDate(task.due_date)}
                </Badge>
              )}
              
              {task.project && (
                <Badge variant="secondary" className="text-xs">
                  {task.project}
                </Badge>
              )}

              {task.labels?.map((label) => (
                <Badge key={label} variant="outline" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Calendar className="h-4 w-4" />
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

        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Flag className={cn("h-4 w-4", priorityColors[task.priority])} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-32 p-2" align="end">
            <div className="flex flex-col gap-1">
              {[1, 2, 3, 4].map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={task.priority === p ? "secondary" : "ghost"}
                  className="justify-start"
                  onClick={() => handlePriorityChange(p)}
                >
                  <Flag className={cn("h-4 w-4 mr-2", priorityColors[p])} />
                  {priorityLabels[p]}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7"
          onClick={() => setIsEditing(true)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>

        <Button 
          size="icon" 
          variant="ghost" 
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
