import { useState, useMemo, useEffect, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { TaskPoolSidebar } from '@/components/TaskPoolSidebar';
import { WeeklyPlannerCalendar } from '@/components/WeeklyPlannerCalendar';
import { useTasks, Task, LIFE_AREAS } from '@/hooks/useTasks';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useSchedulingSuggestions } from '@/hooks/useSchedulingSuggestions';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  LogIn, 
  Loader2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  RefreshCw,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { format, startOfWeek, addWeeks, subWeeks, setHours, setMinutes, addMinutes } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Review() {
  const { user } = useAuth();
  const { tasks, createTask, updateTask, deleteTask } = useTasks();
  const { events, isConnected, isLoading: isCalendarLoading, fetchEvents } = useGoogleCalendar();
  const { suggestions, isLoading: isSuggestionsLoading, getSuggestions } = useSchedulingSuggestions();
  
  const [weekStartDate, setWeekStartDate] = useState(() => startOfWeek(new Date()));
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Filter tasks to show only unscheduled (or recurring that need rescheduling)
  const unscheduledTasks = useMemo(() => {
    return tasks.filter(t => !t.completed && !t.scheduled_at);
  }, [tasks]);

  // Calculate total time of unscheduled tasks
  const totalTime = useMemo(() => {
    return unscheduledTasks
      .filter(t => t.time_estimate_minutes)
      .reduce((sum, t) => sum + (t.time_estimate_minutes || 0), 0);
  }, [unscheduledTasks]);

  // Get suggested tasks based on AI suggestions (only from unscheduled tasks)
  const suggestedTasks = useMemo(() => {
    if (suggestions.length === 0) return [];
    return suggestions
      .map(s => unscheduledTasks.find(t => t.id === s.taskId))
      .filter((t): t is Task => t !== undefined);
  }, [suggestions, unscheduledTasks]);

  // Fetch events when week changes
  useEffect(() => {
    if (isConnected) {
      const timeMin = weekStartDate.toISOString();
      const timeMax = addWeeks(weekStartDate, 1).toISOString();
      fetchEvents(timeMin, timeMax);
    }
  }, [weekStartDate, isConnected, fetchEvents]);

  // Get AI suggestions when data is ready
  const handleGetSuggestions = useCallback(async () => {
    if (!isConnected || unscheduledTasks.length === 0) return;
    await getSuggestions(unscheduledTasks, events, weekStartDate);
  }, [unscheduledTasks, events, weekStartDate, isConnected, getSuggestions]);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('application/json', JSON.stringify(task));
    e.dataTransfer.effectAllowed = 'copy';
    setDraggingTask(task);
  };

  const handleDragEnd = () => {
    setDraggingTask(null);
  };

  const handleDropTask = async (task: Task, date: Date, hour: number) => {
    if (!isConnected) {
      toast.error('Connect Google Calendar in Settings first');
      return;
    }

    setIsCreatingEvent(true);
    setPendingSlot({ date, hour });

    try {
      const startTime = setMinutes(setHours(date, hour), 0);
      const duration = task.time_estimate_minutes || 60;
      const endTime = addMinutes(startTime, duration);

      // Get life area for description
      const lifeArea = LIFE_AREAS.find(a => a.value === task.life_area);
      const description = [
        task.description,
        lifeArea ? `Life Area: ${lifeArea.label}` : null,
        `Priority: ${{ 1: 'Urgent', 2: 'High', 3: 'Medium', 4: 'Low' }[task.priority] || 'Normal'}`,
      ].filter(Boolean).join('\n');

      const { data, error } = await supabase.functions.invoke('google-calendar-create-event', {
        body: {
          summary: task.title,
          description,
          start: startTime.toISOString(),
          end: endTime.toISOString(),
        },
      });

      if (error) {
        // Check if it's a scope/permission error
        const errorMessage = error.message || String(error);
        if (errorMessage.includes('insufficient') || errorMessage.includes('scope') || errorMessage.includes('permission')) {
          toast.error('Calendar permissions need to be updated. Please disconnect and reconnect Google Calendar in Settings.', {
            duration: 8000,
            action: {
              label: 'Go to Settings',
              onClick: () => window.location.href = '/settings',
            },
          });
          return;
        }
        throw error;
      }

      toast.success(`Scheduled "${task.title}" for ${format(startTime, 'EEE h:mm a')}`);
      
      // Mark task as scheduled (store event ID if available)
      const eventId = data?.id || data?.eventId || null;
      await updateTask(task.id, {
        scheduled_at: new Date().toISOString(),
        google_event_id: eventId,
      });
      
      // Refresh events
      const timeMin = weekStartDate.toISOString();
      const timeMax = addWeeks(weekStartDate, 1).toISOString();
      await fetchEvents(timeMin, timeMax);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create calendar event');
    } finally {
      setIsCreatingEvent(false);
      setPendingSlot(null);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekStartDate(prev => 
      direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)
    );
  };

  const goToThisWeek = () => {
    setWeekStartDate(startOfWeek(new Date()));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <Navigation />
        <main className="flex-1 pb-20 md:pb-0 flex items-center justify-center p-6">
          <motion.div 
            className="text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-4 rounded-full bg-muted inline-block">
              <LogIn className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-serif text-xl">Sign in to plan your week</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Access your weekly review and schedule your tasks.
            </p>
            <Button asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  if (!isConnected && !isCalendarLoading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <Navigation />
        <main className="flex-1 pb-20 md:pb-0 flex items-center justify-center p-6">
          <motion.div 
            className="text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-4 rounded-full bg-muted inline-block">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-serif text-xl">Connect your calendar</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Connect Google Calendar to drag and drop tasks into your schedule.
            </p>
            <Button asChild>
              <Link to="/settings">Go to Settings</Link>
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Navigation />
      
      <div className="flex-1 flex flex-col overflow-hidden pb-20 md:pb-0">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b bg-background flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
              className="hidden md:flex"
            >
              {showSidebar ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </Button>
            
            <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToThisWeek} className="hidden sm:inline-flex">
              This Week
            </Button>
          </div>

          <h1 className="font-serif text-lg md:text-xl">
            Week of {format(weekStartDate, 'MMM d, yyyy')}
          </h1>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetSuggestions}
              disabled={isSuggestionsLoading || unscheduledTasks.length === 0}
              className="gap-2"
            >
              {isSuggestionsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Get Suggestions</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const timeMin = weekStartDate.toISOString();
                const timeMax = addWeeks(weekStartDate, 1).toISOString();
                fetchEvents(timeMin, timeMax);
              }}
              disabled={isCalendarLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isCalendarLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Task Pool Sidebar */}
          {showSidebar && (
            <motion.div 
              className="w-80 flex-shrink-0 hidden md:block"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
            >
              <TaskPoolSidebar
                tasks={unscheduledTasks}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onCreateTask={createTask}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                suggestedTasks={suggestedTasks}
                totalTime={totalTime}
              />
            </motion.div>
          )}

          {/* Calendar */}
          <div className="flex-1 p-3 md:p-4 overflow-hidden">
            {isCalendarLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <WeeklyPlannerCalendar
                events={events}
                weekStartDate={weekStartDate}
                onDropTask={handleDropTask}
                isCreating={isCreatingEvent}
                pendingSlot={pendingSlot}
              />
            )}
          </div>
        </div>

        {/* Mobile task drawer hint */}
        <div className="md:hidden fixed bottom-24 left-4 right-4 p-3 bg-card border rounded-lg shadow-lg text-center text-sm text-muted-foreground">
          <p>Open the Tasks page to add tasks, then return here to schedule them.</p>
        </div>
      </div>
    </div>
  );
}
