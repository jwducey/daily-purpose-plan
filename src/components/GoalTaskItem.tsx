import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Plus, Calendar, Repeat, X, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Task, CreateTaskInput } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

interface GoalTaskItemProps {
  tasks: Task[];
  goalId: string;
  goalText: string;
  lifeAreaName: string;
  onCreateTask: (input: CreateTaskInput) => Promise<any>;
  onToggleTask: (taskId: string, completed: boolean) => void;
}

export function GoalTaskItem({ tasks, goalId, goalText, lifeAreaName, onCreateTask, onToggleTask }: GoalTaskItemProps) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePerWeek, setRecurrencePerWeek] = useState(1);
  const [expanded, setExpanded] = useState(true);

  const goalTasks = tasks.filter(t => t.labels?.includes(`goal:${goalId}`));
  const incompleteTasks = goalTasks.filter(t => !t.completed);
  const completedTasks = goalTasks.filter(t => t.completed);

  const handleAdd = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    await onCreateTask({
      title: trimmed,
      life_areas: [lifeAreaName],
      labels: [`goal:${goalId}`],
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
      is_recurring: isRecurring,
      recurrence_per_week: isRecurring ? recurrencePerWeek : undefined,
    });

    setTitle('');
    setDueDate(undefined);
    setIsRecurring(false);
    setRecurrencePerWeek(1);
    setAdding(false);
  };

  return (
    <div className="mt-2 space-y-1">
      {goalTasks.length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
          <span>{incompleteTasks.length} task{incompleteTasks.length !== 1 ? 's' : ''}</span>
          {completedTasks.length > 0 && (
            <span className="text-muted-foreground/60">· {completedTasks.length} done</span>
          )}
        </button>
      )}

      {expanded && goalTasks.map(task => (
        <div key={task.id} className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-muted/30">
          <Checkbox
            checked={task.completed}
            onCheckedChange={(checked) => onToggleTask(task.id, !!checked)}
            className="h-3.5 w-3.5"
          />
          <span className={cn("flex-1 min-w-0 truncate", task.completed && "line-through text-muted-foreground")}>
            {task.title}
          </span>
          {task.is_recurring && (
            <Repeat className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
          )}
          {task.due_date && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              {format(new Date(task.due_date), 'MMM d')}
            </span>
          )}
        </div>
      ))}

      {adding ? (
        <div className="space-y-2 p-2 rounded-lg border border-border bg-muted/20">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') setAdding(false);
            }}
            placeholder="Task title..."
            className="h-7 text-xs"
            autoFocus
          />
          <div className="flex items-center gap-2 flex-wrap">
            {/* Due date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-6 px-2 text-[10px] gap-1", dueDate && "text-foreground")}>
                  <Calendar className="h-2.5 w-2.5" />
                  {dueDate ? format(dueDate, 'MMM d') : 'Deadline'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Recurring toggle */}
            <Button
              variant={isRecurring ? "secondary" : "outline"}
              size="sm"
              className="h-6 px-2 text-[10px] gap-1"
              onClick={() => setIsRecurring(!isRecurring)}
            >
              <Repeat className="h-2.5 w-2.5" />
              {isRecurring ? `${recurrencePerWeek}x/week` : 'Recurring'}
            </Button>

            {isRecurring && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 5, 7].map(n => (
                  <button
                    key={n}
                    onClick={() => setRecurrencePerWeek(n)}
                    className={cn(
                      "h-5 w-5 rounded text-[10px] transition-colors",
                      recurrencePerWeek === n
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1 ml-auto">
              <Button size="sm" className="h-6 px-2 text-[10px]" onClick={handleAdd} disabled={!title.trim()}>
                <Plus className="h-2.5 w-2.5 mr-0.5" /> Add
              </Button>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => setAdding(false)}>
                <X className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors mt-1"
        >
          <Plus className="h-2.5 w-2.5" />
          <span>Add task</span>
        </button>
      )}
    </div>
  );
}
