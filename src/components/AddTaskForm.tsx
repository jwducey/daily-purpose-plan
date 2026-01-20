import { useState } from 'react';
import { CreateTaskInput, LIFE_AREAS, TIME_ESTIMATES } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Calendar, 
  Flag, 
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  Repeat
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface AddTaskFormProps {
  onAdd: (input: CreateTaskInput) => Promise<any>;
}

const priorityColors: Record<number, string> = {
  1: 'text-red-500',
  2: 'text-orange-500',
  3: 'text-blue-500',
  4: 'text-muted-foreground',
};

const priorityLabels: Record<number, string> = {
  1: 'Priority 1',
  2: 'Priority 2',
  3: 'Priority 3',
  4: 'Priority 4',
};

export function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [priority, setPriority] = useState(4);
  const [timeEstimate, setTimeEstimate] = useState<number | undefined>();
  const [lifeArea, setLifeArea] = useState<string | undefined>();
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate?.toISOString(),
        priority,
        time_estimate_minutes: timeEstimate,
        life_area: lifeArea,
        is_recurring: isRecurring,
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setDueDate(undefined);
      setPriority(4);
      setTimeEstimate(undefined);
      setLifeArea(undefined);
      setIsRecurring(false);
      setShowDetails(false);
      setIsExpanded(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setIsExpanded(false);
    }
  };

  const selectedTimeEstimate = TIME_ESTIMATES.find(t => t.value === timeEstimate);
  const selectedLifeArea = LIFE_AREAS.find(a => a.value === lifeArea);

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start text-muted-foreground hover:text-foreground"
        onClick={() => setIsExpanded(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add task
      </Button>
    );
  }

  return (
    <div className="border border-border rounded-lg p-3 bg-card">
      <Input
        placeholder="Task name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        className="border-0 p-0 text-sm font-medium focus-visible:ring-0 placeholder:text-muted-foreground"
        autoFocus
      />

      {showDetails && (
        <Textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border-0 p-0 mt-2 text-sm resize-none focus-visible:ring-0 placeholder:text-muted-foreground min-h-[60px]"
        />
      )}

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className={cn(dueDate && "text-primary")}
            >
              <Calendar className="h-4 w-4 mr-1" />
              {dueDate ? format(dueDate, 'MMM d') : 'Due date'}
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

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Flag className={cn("h-4 w-4 mr-1", priorityColors[priority])} />
              {priorityLabels[priority]}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2" align="start">
            <div className="flex flex-col gap-1">
              {[1, 2, 3, 4].map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={priority === p ? "secondary" : "ghost"}
                  className="justify-start"
                  onClick={() => setPriority(p)}
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
            <Button 
              variant="outline" 
              size="sm"
              className={cn(timeEstimate && "text-primary")}
            >
              <Clock className="h-4 w-4 mr-1" />
              {selectedTimeEstimate?.label || 'Time estimate'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2" align="start">
            <div className="flex flex-col gap-1">
              {TIME_ESTIMATES.map((t) => (
                <Button
                  key={t.value}
                  size="sm"
                  variant={timeEstimate === t.value ? "secondary" : "ghost"}
                  className="justify-start"
                  onClick={() => setTimeEstimate(t.value)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {t.label}
                </Button>
              ))}
              {timeEstimate && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="justify-start text-muted-foreground"
                  onClick={() => setTimeEstimate(undefined)}
                >
                  Clear
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className={cn(lifeArea && "text-primary")}
            >
              {selectedLifeArea ? (
                <>
                  <span className={cn("h-3 w-3 rounded-full mr-2", selectedLifeArea.color)} />
                  {selectedLifeArea.label}
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 mr-1" />
                  Life area
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-2" align="start">
            <div className="flex flex-col gap-1">
              {LIFE_AREAS.map((area) => (
                <Button
                  key={area.value}
                  size="sm"
                  variant={lifeArea === area.value ? "secondary" : "ghost"}
                  className="justify-start"
                  onClick={() => setLifeArea(area.value)}
                >
                  <span className={cn("h-3 w-3 rounded-full mr-2", area.color)} />
                  {area.label}
                </Button>
              ))}
              {lifeArea && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="justify-start text-muted-foreground"
                  onClick={() => setLifeArea(undefined)}
                >
                  Clear
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant={isRecurring ? "secondary" : "outline"}
          size="sm"
          onClick={() => setIsRecurring(!isRecurring)}
          className={cn(isRecurring && "text-primary")}
          title="Recurring task - will repopulate after scheduled event is completed"
        >
          <Repeat className="h-4 w-4 mr-1" />
          Recurring
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(false)}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!title.trim() || isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add task'}
        </Button>
      </div>
    </div>
  );
}