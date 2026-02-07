import { useState } from 'react';
import { Task, UpdateTaskInput, TIME_ESTIMATES } from '@/hooks/useTasks';
import { useUser } from '@/contexts/UserContext';
import { GOOGLE_CALENDAR_COLORS } from '@/types/user';
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
  GripVertical,
  Clock,
  Target
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Checkbox as CheckboxPrimitive } from '@/components/ui/checkbox';

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
  const { categories } = useUser();
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

  const handleTimeEstimateChange = async (minutes: number | null) => {
    await onUpdate(task.id, { time_estimate_minutes: minutes });
  };

  const toggleLifeArea = async (areaName: string) => {
    const current = task.life_areas || [];
    const updated = current.includes(areaName)
      ? current.filter(a => a !== areaName)
      : [...current, areaName];
    await onUpdate(task.id, { life_areas: updated.length > 0 ? updated : null });
  };

  const formatDueDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const formatTimeEstimate = (minutes: number) => {
    const estimate = TIME_ESTIMATES.find(t => t.value === minutes);
    if (estimate) return estimate.label;
    if (minutes < 60) return `${minutes}m`;
    return `${Math.round(minutes / 60)}h`;
  };

  const taskAreas = (task.life_areas || []).map(area => {
    const cat = categories.find(c => c.name.toLowerCase() === area);
    return cat ? { name: cat.name, colorId: cat.googleColorId } : { name: area, colorId: '1' };
  });

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

              {task.time_estimate_minutes && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTimeEstimate(task.time_estimate_minutes)}
                </Badge>
              )}

              {taskAreas.map(area => (
                <Badge key={area.name} variant="outline" className="text-xs">
                  <span 
                    className="h-2 w-2 rounded-full mr-1 inline-block"
                    style={{ backgroundColor: GOOGLE_CALENDAR_COLORS[area.colorId]?.hex }}
                  />
                  {area.name}
                </Badge>
              ))}
              
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

        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Clock className={cn("h-4 w-4", task.time_estimate_minutes && "text-primary")} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-2" align="end">
            <div className="flex flex-col gap-1">
              {TIME_ESTIMATES.map((t) => (
                <Button
                  key={t.value}
                  size="sm"
                  variant={task.time_estimate_minutes === t.value ? "secondary" : "ghost"}
                  className="justify-start"
                  onClick={() => handleTimeEstimateChange(t.value)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {t.label}
                </Button>
              ))}
              {task.time_estimate_minutes && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="justify-start text-muted-foreground"
                  onClick={() => handleTimeEstimateChange(null)}
                >
                  Clear
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Multi-select life areas */}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              {taskAreas.length > 0 ? (
                <div className="flex -space-x-1">
                  {taskAreas.slice(0, 2).map(a => (
                    <span 
                      key={a.name}
                      className="h-3 w-3 rounded-full border border-card" 
                      style={{ backgroundColor: GOOGLE_CALENDAR_COLORS[a.colorId]?.hex }}
                    />
                  ))}
                </div>
              ) : (
                <Target className="h-4 w-4" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="end">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground px-2 py-1">Select areas</p>
              {categories.map((cat) => {
                const areaKey = cat.name.toLowerCase();
                const isSelected = (task.life_areas || []).includes(areaKey);
                return (
                  <button
                    key={cat.id}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors text-left",
                      isSelected && "bg-muted"
                    )}
                    onClick={() => toggleLifeArea(areaKey)}
                  >
                    <CheckboxPrimitive checked={isSelected} className="h-3.5 w-3.5" />
                    <span 
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: GOOGLE_CALENDAR_COLORS[cat.googleColorId]?.hex }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
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
