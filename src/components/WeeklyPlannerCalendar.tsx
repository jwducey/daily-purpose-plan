import { useMemo, useState, useCallback } from 'react';
import { format, addDays, startOfWeek, isSameDay, parseISO, setHours, setMinutes, differenceInMinutes, addMinutes } from 'date-fns';
import { CalendarEvent } from '@/hooks/useGoogleCalendar';
import { Task } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { EditEventDialog } from './EditEventDialog';
import { useUser } from '@/contexts/UserContext';

interface WeeklyPlannerCalendarProps {
  events: CalendarEvent[];
  weekStartDate: Date;
  onDropTask: (task: Task, date: Date, hour: number) => Promise<void>;
  isCreating?: boolean;
  pendingSlot?: { date: Date; hour: number } | null;
  onEventUpdated?: () => void;
  onEventDeleted?: () => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 10 PM
const HOUR_HEIGHT = 48;

export function WeeklyPlannerCalendar({ 
  events, 
  weekStartDate, 
  onDropTask, 
  isCreating,
  pendingSlot,
  onEventUpdated,
  onEventDeleted
}: WeeklyPlannerCalendarProps) {
  const [dragOverSlot, setDragOverSlot] = useState<{ dayIndex: number; hour: number } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { categories } = useUser();

  const extractLifeAreaFromDescription = (description?: string) => {
    if (!description) return null;
    const lifeAreaMatch = description.match(/Life Area:\s*([^\n\r]+)/i);
    if (lifeAreaMatch?.[1]) return lifeAreaMatch[1].trim();
    const dailyReviewMatch = description.match(/Daily Review Activity\s*-\s*([^\n\r(]+)/i);
    if (dailyReviewMatch?.[1]) return dailyReviewMatch[1].trim();
    return null;
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.colorId) {
      const matchingCategory = categories.find(cat => cat.googleColorId === event.colorId);
      if (matchingCategory) {
        return { backgroundColor: `hsl(var(--category-${matchingCategory.color}))` };
      }
    }
    const inferred = extractLifeAreaFromDescription(event.description) || event.summary;
    if (inferred) {
      const byName = categories.find(cat => cat.name.toLowerCase() === inferred.toLowerCase());
      if (byName) {
        return { backgroundColor: `hsl(var(--category-${byName.color}))` };
      }
    }
    return { backgroundColor: 'hsl(var(--muted))' };
  };

  const dates = useMemo(() => {
    const start = startOfWeek(weekStartDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekStartDate]);

  const getEventsForDay = useCallback((date: Date) => {
    return events.filter((event) => {
      if (event.allDay) return false;
      const eventStart = parseISO(event.start);
      return isSameDay(eventStart, date);
    });
  }, [events]);

  const getEventPosition = (event: CalendarEvent) => {
    const eventStart = parseISO(event.start);
    const eventEnd = parseISO(event.end);
    
    const startHour = eventStart.getHours() + eventStart.getMinutes() / 60;
    const endHour = eventEnd.getHours() + eventEnd.getMinutes() / 60;
    
    const top = (startHour - 6) * HOUR_HEIGHT;
    const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 20);
    
    return { top, height };
  };

  // Calculate overlapping event positions
  const getOverlapLayout = useCallback((dayEvents: CalendarEvent[]) => {
    if (dayEvents.length === 0) return [];

    // Sort events by start time, then by duration (longer first)
    const sortedEvents = [...dayEvents].sort((a, b) => {
      const aStart = parseISO(a.start);
      const bStart = parseISO(b.start);
      if (aStart.getTime() !== bStart.getTime()) {
        return aStart.getTime() - bStart.getTime();
      }
      const aDuration = differenceInMinutes(parseISO(a.end), aStart);
      const bDuration = differenceInMinutes(parseISO(b.end), bStart);
      return bDuration - aDuration;
    });

    const columns: CalendarEvent[][] = [];
    const eventColumns: Map<string, { column: number; totalColumns: number }> = new Map();

    for (const event of sortedEvents) {
      const eventStart = parseISO(event.start);
      const eventEnd = parseISO(event.end);

      // Find a column where this event doesn't overlap with existing events
      let placedColumn = -1;
      for (let col = 0; col < columns.length; col++) {
        const columnEvents = columns[col];
        const hasOverlap = columnEvents.some(existingEvent => {
          const existingStart = parseISO(existingEvent.start);
          const existingEnd = parseISO(existingEvent.end);
          return eventStart < existingEnd && eventEnd > existingStart;
        });

        if (!hasOverlap) {
          placedColumn = col;
          break;
        }
      }

      if (placedColumn === -1) {
        placedColumn = columns.length;
        columns.push([]);
      }

      columns[placedColumn].push(event);
      eventColumns.set(event.id, { column: placedColumn, totalColumns: 0 });
    }

    // Update total columns for each event based on overlapping groups
    for (const event of sortedEvents) {
      const eventStart = parseISO(event.start);
      const eventEnd = parseISO(event.end);

      // Find max column index among overlapping events
      let maxColumn = 0;
      for (const otherEvent of sortedEvents) {
        const otherStart = parseISO(otherEvent.start);
        const otherEnd = parseISO(otherEvent.end);
        
        if (eventStart < otherEnd && eventEnd > otherStart) {
          const otherCol = eventColumns.get(otherEvent.id)!.column;
          maxColumn = Math.max(maxColumn, otherCol);
        }
      }

      const info = eventColumns.get(event.id)!;
      info.totalColumns = maxColumn + 1;
    }

    return sortedEvents.map(event => ({
      event,
      ...getEventPosition(event),
      ...eventColumns.get(event.id)!
    }));
  }, []);

  const handleDragOver = (e: React.DragEvent, dayIndex: number, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverSlot({ dayIndex, hour });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = async (e: React.DragEvent, dayIndex: number, hour: number) => {
    e.preventDefault();
    setDragOverSlot(null);
    
    try {
      const taskData = e.dataTransfer.getData('application/json');
      if (!taskData) return;
      
      const task: Task = JSON.parse(taskData);
      const targetDate = dates[dayIndex];
      
      await onDropTask(task, targetDate, hour);
    } catch (error) {
      console.error('Drop error:', error);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditDialogOpen(true);
  };

  const handleEventUpdated = () => {
    onEventUpdated?.();
  };

  const handleEventDeleted = () => {
    onEventDeleted?.();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden border rounded-lg bg-card">
      {/* Header with day names */}
      <div className="flex border-b bg-muted/30 sticky top-0 z-20">
        <div className="w-14 flex-shrink-0" />
        {dates.map((date, i) => {
          const isToday = isSameDay(date, new Date());
          return (
            <div
              key={i}
              className={cn(
                "flex-1 text-center py-2 border-l",
                isToday && "bg-primary/10"
              )}
            >
              <div className="text-xs text-muted-foreground font-medium">
                {format(date, 'EEE')}
              </div>
              <div className={cn(
                "text-lg font-semibold",
                isToday && "text-primary"
              )}>
                {format(date, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto">
        <div className="flex" style={{ height: HOURS.length * HOUR_HEIGHT }}>
          {/* Time labels */}
          <div className="w-14 flex-shrink-0 relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full text-right pr-2 text-xs text-muted-foreground"
                style={{ top: (hour - 6) * HOUR_HEIGHT - 6 }}
              >
                {hour > 6 && format(setMinutes(setHours(new Date(), hour), 0), 'h a')}
              </div>
            ))}
          </div>

          {/* Day columns with drop zones */}
          {dates.map((date, dayIndex) => {
            const dayEvents = getEventsForDay(date);
            const eventLayout = getOverlapLayout(dayEvents);
            const isToday = isSameDay(date, new Date());

            return (
              <div
                key={dayIndex}
                className={cn(
                  "flex-1 relative border-l",
                  isToday && "bg-primary/5"
                )}
              >
                {/* Hour slots as drop zones */}
                {HOURS.map((hour) => {
                  const isHovered = dragOverSlot?.dayIndex === dayIndex && dragOverSlot?.hour === hour;
                  const isPending = pendingSlot && 
                    isSameDay(pendingSlot.date, date) && 
                    pendingSlot.hour === hour;

                  return (
                    <div
                      key={hour}
                      className={cn(
                        "absolute w-full border-t border-border/30 transition-colors",
                        isHovered && "bg-primary/20",
                        isPending && "bg-primary/30"
                      )}
                      style={{ top: (hour - 6) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                      onDragOver={(e) => handleDragOver(e, dayIndex, hour)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, dayIndex, hour)}
                    >
                      {isPending && isCreating && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Existing calendar events with overlap handling */}
                <AnimatePresence>
                  {eventLayout.map(({ event, top, height, column, totalColumns }) => {
                    const widthPercent = 100 / totalColumns;
                    const leftPercent = column * widthPercent;
                    
                    return (
                      <motion.div
                        key={event.id}
                        className="absolute rounded px-1.5 py-1 border border-border/20 text-xs overflow-hidden cursor-pointer hover:brightness-110 transition-all"
                        style={{ 
                          top, 
                          height, 
                          minHeight: 20,
                          width: `calc(${widthPercent}% - 4px)`,
                          left: `calc(${leftPercent}% + 2px)`,
                          zIndex: column + 1,
                          ...getEventColor(event),
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ zIndex: 20 }}
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="font-medium truncate text-white/90">
                          {event.summary}
                        </div>
                        {height > 30 && (
                          <div className="text-white/70 truncate">
                            {format(parseISO(event.start), 'h:mm a')}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Current time indicator */}
                {isToday && (() => {
                  const now = new Date();
                  const currentHour = now.getHours();
                  if (currentHour >= 6 && currentHour < 22) {
                    const top = (currentHour - 6 + now.getMinutes() / 60) * HOUR_HEIGHT;
                    return (
                      <div
                        className="absolute left-0 right-0 flex items-center z-10"
                        style={{ top }}
                      >
                        <div className="w-2 h-2 rounded-full bg-destructive -ml-1" />
                        <div className="flex-1 h-0.5 bg-destructive" />
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            );
          })}
        </div>
      </div>

      <EditEventDialog
        event={selectedEvent}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onEventUpdated={handleEventUpdated}
        onEventDeleted={handleEventDeleted}
        allEvents={events}
      />
    </div>
  );
}
