import { useState, useMemo, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { CalendarMultiDayView } from '@/components/CalendarMultiDayView';
import { CalendarMonthView } from '@/components/CalendarMonthView';
import { MiniCalendar } from '@/components/MiniCalendar';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import { TaskPoolSidebar } from '@/components/TaskPoolSidebar';
import { BudgetGapPrompt } from '@/components/BudgetGapPrompt';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useTasks, Task } from '@/hooks/useTasks';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  LogIn, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Menu,
  Plus
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, startOfWeek, startOfMonth, setHours, setMinutes, addMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

type ViewType = 'day' | 'week' | 'month' | 'custom';

const VIEW_OPTIONS = [
  { value: 'day', label: 'Day', days: 1 },
  { value: '3days', label: '3 Days', days: 3 },
  { value: '5days', label: '5 Days', days: 5 },
  { value: 'week', label: 'Week', days: 7 },
  { value: 'month', label: 'Month', days: 0 },
];

export default function Calendar() {
  const { user } = useAuth();
  const { events, isConnected, isLoading, fetchEvents } = useGoogleCalendar();
  const { tasks, createTask, updateTask, deleteTask } = useTasks();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewType, setViewType] = useState('week');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [createEventDefaultDate, setCreateEventDefaultDate] = useState<Date | undefined>();
  const [createEventDefaultTime, setCreateEventDefaultTime] = useState<string | undefined>();
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  const viewConfig = VIEW_OPTIONS.find(v => v.value === viewType) || VIEW_OPTIONS[3];
  const isMonthView = viewType === 'month';
  const numberOfDays = viewConfig.days;

  // Calculate the start date based on view type
  const viewStartDate = useMemo(() => {
    if (isMonthView) return startOfMonth(selectedDate);
    if (viewType === 'week') return startOfWeek(selectedDate);
    return selectedDate;
  }, [selectedDate, viewType, isMonthView]);

  // Calculate visible range for mini calendar highlighting
  const visibleRange = useMemo(() => {
    if (isMonthView) {
      return { start: startOfMonth(selectedDate), end: addMonths(startOfMonth(selectedDate), 1) };
    }
    return { start: viewStartDate, end: addDays(viewStartDate, numberOfDays - 1) };
  }, [viewStartDate, numberOfDays, isMonthView, selectedDate]);

  const handleRefresh = async () => {
    const now = new Date();
    const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();
    await fetchEvents(timeMin, timeMax);
  };

  // Fetch events when connected
  useEffect(() => {
    if (isConnected) {
      handleRefresh();
    }
  }, [isConnected]);

  const navigatePrevious = () => {
    if (isMonthView) {
      setSelectedDate(subMonths(selectedDate, 1));
    } else if (viewType === 'week') {
      setSelectedDate(subWeeks(selectedDate, 1));
    } else {
      setSelectedDate(subDays(selectedDate, numberOfDays));
    }
  };

  const navigateNext = () => {
    if (isMonthView) {
      setSelectedDate(addMonths(selectedDate, 1));
    } else if (viewType === 'week') {
      setSelectedDate(addWeeks(selectedDate, 1));
    } else {
      setSelectedDate(addDays(selectedDate, numberOfDays));
    }
  };

  const goToToday = () => setSelectedDate(new Date());

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSidebarOpen(false);
  };

  const handleMonthDateClick = (date: Date) => {
    setSelectedDate(date);
    setViewType('day');
  };

  const handleCreateEvent = (date?: Date, time?: string) => {
    setCreateEventDefaultDate(date || selectedDate);
    setCreateEventDefaultTime(time);
    setShowCreateEvent(true);
  };

  const handleEventCreated = () => {
    handleRefresh();
  };

  // Filter tasks to show only those that need scheduling
  const unscheduledTasks = useMemo(() => {
    const now = new Date();
    const nextWeek = addDays(now, 7);
    
    return tasks.filter(t => {
      if (t.completed) return false;
      
      // For recurring tasks with a frequency, check if sufficiently scheduled in next 7 days
      if (t.is_recurring && t.recurrence_per_week) {
        const upcomingCount = events.filter(event => {
          const eventStart = new Date(event.start);
          return (
            event.summary === t.title &&
            eventStart >= now &&
            eventStart <= nextWeek
          );
        }).length;
        // Count skips toward the quota too
        const totalHandled = upcomingCount + (t.skip_count || 0);
        // Hide if already scheduled + skipped enough times this week
        return totalHandled < t.recurrence_per_week;
      }
      
      // Show unscheduled tasks
      if (!t.scheduled_at) return true;
      // Show recurring tasks whose scheduled time has passed (ready to be rescheduled)
      if (t.is_recurring && new Date(t.scheduled_at) < now) return true;
      return false;
    });
  }, [tasks, events]);

  // Calculate total time of unscheduled tasks
  const totalTime = useMemo(() => {
    return unscheduledTasks
      .filter(t => t.time_estimate_minutes)
      .reduce((sum, t) => sum + (t.time_estimate_minutes || 0), 0);
  }, [unscheduledTasks]);

  // Drag and drop handlers for tasks
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

    try {
      const startTime = setMinutes(setHours(date, hour), 0);
      const duration = task.time_estimate_minutes || 60;
      const endTime = addMinutes(startTime, duration);

      const areas = task.life_areas || [];
      const description = [
        task.description,
        areas.length > 0 ? `Life Area: ${areas.join(', ')}` : null,
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
      
      const eventId = data?.id || data?.eventId || null;
      
      // For recurring tasks with frequency, don't set scheduled_at — let the event count control visibility
      if (task.is_recurring && task.recurrence_per_week) {
        await updateTask(task.id, { google_event_id: eventId, skip_count: 0 });
      } else {
        await updateTask(task.id, {
          scheduled_at: new Date().toISOString(),
          google_event_id: eventId,
        });
      }
      
      handleRefresh();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create calendar event');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const getHeaderTitle = () => {
    if (isMonthView) {
      return format(selectedDate, 'MMMM yyyy');
    }
    if (numberOfDays === 1) {
      return format(selectedDate, 'MMMM d, yyyy');
    }
    const endDate = addDays(viewStartDate, numberOfDays - 1);
    if (format(viewStartDate, 'MMMM yyyy') === format(endDate, 'MMMM yyyy')) {
      return `${format(viewStartDate, 'MMMM d')} - ${format(endDate, 'd, yyyy')}`;
    }
    return `${format(viewStartDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
  };

  const SidebarContentBlock = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border space-y-2 flex-shrink-0">
        <Button onClick={() => handleCreateEvent()} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
        <Button onClick={goToToday} variant="outline" className="w-full">
          Today
        </Button>
      </div>
      <Collapsible defaultOpen={true}>
        <div className="p-3 border-b border-border">
          <CollapsibleTrigger className="flex items-center gap-2 w-full hover:opacity-80 transition-opacity">
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground collapsible-chevron" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Calendar</span>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <MiniCalendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            selectedRange={visibleRange}
          />
        </CollapsibleContent>
      </Collapsible>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <BudgetGapPrompt
          events={events}
          onCreateEvent={handleCreateEvent}
          onCreateTask={createTask}
        />
        <div className="border-t">
          <TaskPoolSidebar
            tasks={unscheduledTasks}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onCreateTask={createTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            totalTime={totalTime}
          />
        </div>
      </div>
    </div>
  );

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
            <h2 className="font-serif text-xl">Sign in to view your calendar</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Connect your Google Calendar to see your schedule and available time.
            </p>
            <Button asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <Navigation />
        <main className="flex-1 pb-20 md:pb-0 flex items-center justify-center p-6">
          <motion.div 
            className="text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Checking calendar connection...</p>
              </>
            ) : (
              <>
                <div className="p-4 rounded-full bg-muted inline-block">
                  <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="font-serif text-xl">Connect your calendar</h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                  Go to Settings to connect your Google Calendar and view your events here.
                </p>
                <Button asChild>
                  <Link to="/settings">Go to Settings</Link>
                </Button>
              </>
            )}
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Navigation />
      
      <main className="flex-1 pb-20 md:pb-0 flex flex-col overflow-hidden">
        {/* Header toolbar */}
        <div className="flex items-center justify-between p-2 md:p-4 border-b border-border bg-background flex-shrink-0 gap-2">
          <div className="flex items-center gap-2">
            {/* Mobile sidebar trigger */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SidebarContentBlock />
              </SheetContent>
            </Sheet>

            <Button variant="outline" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToToday}
              className="hidden sm:inline-flex"
            >
              Today
            </Button>
          </div>

          <h2 className="font-serif text-sm md:text-lg truncate flex-1 text-center">
            {getHeaderTitle()}
          </h2>

          <div className="flex items-center gap-2">
            <Select value={viewType} onValueChange={setViewType}>
              <SelectTrigger className="w-[100px] md:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIEW_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh} 
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button 
              size="icon" 
              onClick={() => handleCreateEvent()}
              className="hidden sm:flex"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Desktop sidebar */}
          <div className="hidden lg:flex lg:flex-col w-80 border-r border-border flex-shrink-0 overflow-hidden">
            <SidebarContentBlock />
          </div>

          {/* Calendar view */}
          <div className="flex-1 overflow-hidden">
            {isMonthView ? (
              <CalendarMonthView
                events={events}
                currentDate={selectedDate}
                onDateClick={handleMonthDateClick}
              />
            ) : (
              <CalendarMultiDayView
                events={events}
                startDate={viewStartDate}
                numberOfDays={numberOfDays}
                onEventUpdated={handleRefresh}
                onEventDeleted={handleRefresh}
                onDropTask={handleDropTask}
                onSlotClick={(date, time) => handleCreateEvent(date, time)}
              />
            )}
          </div>

        </div>

        <CreateEventDialog
          open={showCreateEvent}
          onOpenChange={setShowCreateEvent}
          onEventCreated={handleEventCreated}
          defaultDate={createEventDefaultDate}
          defaultTime={createEventDefaultTime}
        />
      </main>
    </div>
  );
}
