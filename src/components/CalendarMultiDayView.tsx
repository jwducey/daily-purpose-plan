import { useMemo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { format, parseISO, startOfDay, addDays, isSameDay, differenceInMinutes, setHours, setMinutes, isWithinInterval, addMinutes } from 'date-fns';
import { CalendarEvent } from '@/hooks/useGoogleCalendar';
import { Task } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { EditEventDialog } from './EditEventDialog';
import { useUser } from '@/contexts/UserContext';
import { Loader2 } from 'lucide-react';

interface CalendarMultiDayViewProps {
  events: CalendarEvent[];
  startDate: Date;
  numberOfDays: number;
  onEventUpdated?: () => void;
  onEventDeleted?: () => void;
  onDropTask?: (task: Task, date: Date, hour: number) => Promise<void>;
  onSlotClick?: (date: Date, time: string) => void;
}

// Full 24-hour calendar
const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 48; // pixels per hour

export function CalendarMultiDayView({ events, startDate, numberOfDays, onEventUpdated, onEventDeleted, onDropTask, onSlotClick }: CalendarMultiDayViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [dragOverSlot, setDragOverSlot] = useState<{ dateIndex: number; hour: number } | null>(null);
  const { categories } = useUser();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Determine awake hours from sleep budget category
  const HOURS = useMemo(() => {
    const sleepCat = categories.find(c => c.name.toLowerCase() === 'sleep');
    const dailySleepHours = sleepCat ? Math.round(sleepCat.weeklyHoursTarget / 7) : 8;
    // Assume bedtime is ~10pm (22:00), wake = 22 + sleepHours - 24
    const sleepHour = 22; // bedtime
    const wakeHour = (sleepHour + dailySleepHours) % 24; // e.g. 22+8=30%24=6

    // Determine which sleep hours have non-sleep events and must stay visible
    const sleepKeywords = ['sleep', 'bedtime', 'rest', 'nap'];
    const visibleDates = Array.from({ length: numberOfDays }, (_, i) => addDays(startDate, i));
    const occupiedHours = new Set<number>();
    for (const event of events) {
      if (event.allDay) continue;
      // Skip sleep-related events — they shouldn't force the hour to show
      const title = (event.summary || '').toLowerCase();
      if (sleepKeywords.some(kw => title.includes(kw))) continue;
      const eventStart = parseISO(event.start);
      const eventEnd = parseISO(event.end);
      for (const date of visibleDates) {
        if (!isSameDay(eventStart, date) && !isSameDay(eventEnd, date)) continue;
        const sH = isSameDay(eventStart, date) ? eventStart.getHours() : 0;
        const eH = isSameDay(eventEnd, date) ? Math.ceil(eventEnd.getHours() + eventEnd.getMinutes() / 60) : 24;
        for (let h = sH; h < eH; h++) occupiedHours.add(h);
      }
    }

    return ALL_HOURS.filter(hour => {
      // Awake hours always show
      if (hour >= wakeHour && hour < sleepHour) return true;
      // Sleep hours only show if they have events
      return occupiedHours.has(hour);
    });
  }, [categories, events, startDate, numberOfDays]);

  const dates = useMemo(() => {
    return Array.from({ length: numberOfDays }, (_, i) => addDays(startDate, i));
  }, [startDate, numberOfDays]);

  const getEventsForDay = (date: Date) => {
    const dayStart = startOfDay(date);
    const dayEnd = addDays(dayStart, 1);

    return events.filter((event) => {
      if (event.allDay) return false;
      const eventStart = parseISO(event.start);
      const eventEnd = parseISO(event.end);
      return (
        isSameDay(eventStart, date) ||
        isSameDay(eventEnd, date) ||
        (eventStart < dayStart && eventEnd > dayEnd)
      );
    });
  };

  const getAllDayEventsForDay = (date: Date) => {
    return events.filter((event) => {
      if (!event.allDay) return false;
      const eventStart = parseISO(event.start);
      const eventEnd = parseISO(event.end);
      return isSameDay(eventStart, date) || 
        isWithinInterval(date, { start: eventStart, end: eventEnd });
    });
  };

  // Scroll to top on mount/date changes since sleep hours are already hidden.
  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: 0 });
    const t1 = window.setTimeout(() => el.scrollTo({ top: 0 }), 0);
    const t2 = window.setTimeout(() => el.scrollTo({ top: 0 }), 50);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [startDate, numberOfDays, events.length, HOURS]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => el.scrollTo({ top: 0 }));
    return () => cancelAnimationFrame(raf);
  }, [startDate, numberOfDays]);

  // Map an absolute hour (fractional) to a pixel position in the filtered HOURS grid
  const hourToPixel = (absHour: number) => {
    // Find which filtered slot this hour falls into
    let pixelPos = 0;
    for (let i = 0; i < HOURS.length; i++) {
      const slotHour = HOURS[i];
      const nextSlotHour = i + 1 < HOURS.length ? HOURS[i + 1] : slotHour + 1;
      if (absHour <= slotHour) {
        pixelPos = i * HOUR_HEIGHT;
        break;
      } else if (absHour < nextSlotHour) {
        pixelPos = (i + (absHour - slotHour)) * HOUR_HEIGHT;
        break;
      }
      pixelPos = (i + 1) * HOUR_HEIGHT;
    }
    return pixelPos;
  };

  const getEventPosition = (event: CalendarEvent, date: Date) => {
    const eventStart = parseISO(event.start);
    const eventEnd = parseISO(event.end);
    const dayStart = startOfDay(date);

    const displayStart = eventStart < dayStart ? dayStart : eventStart;
    const startHourFrac = differenceInMinutes(displayStart, dayStart) / 60;
    const top = Math.max(hourToPixel(startHourFrac), 0);

    const dayEnd = addDays(dayStart, 1);
    const displayEnd = eventEnd > dayEnd ? dayEnd : eventEnd;
    const endHourFrac = differenceInMinutes(displayEnd, dayStart) / 60;
    const bottom = hourToPixel(endHourFrac);
    const height = Math.max(bottom - top, 20);

    return { top, height };
  };

  // Calculate overlapping event positions
  const getOverlapLayout = (dayEvents: CalendarEvent[], date: Date) => {
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
      ...getEventPosition(event, date),
      ...eventColumns.get(event.id)!
    }));
  };

  const extractLifeAreaFromDescription = (description?: string) => {
    if (!description) return null;

    // Pattern 1: "Life Area: X" (used when scheduling tasks)
    const lifeAreaMatch = description.match(/Life Area:\s*([^\n\r]+)/i);
    if (lifeAreaMatch?.[1]) return lifeAreaMatch[1].trim();

    // Pattern 2: "Daily Review Activity - X" (used for daily review sync)
    const dailyReviewMatch = description.match(/Daily Review Activity\s*-\s*([^\n\r(]+)/i);
    if (dailyReviewMatch?.[1]) return dailyReviewMatch[1].trim();

    return null;
  };

  const getEventColor = (event: CalendarEvent) => {
    // 1) Best: match by Google colorId to a budget category
    if (event.colorId) {
      const matchingCategory = categories.find(cat => cat.googleColorId === event.colorId);
      if (matchingCategory) {
        return { backgroundColor: `hsl(var(--category-${matchingCategory.color}))` };
      }
    }

    // 2) Next: infer life area from description/summary and map to budget category
    const inferred = extractLifeAreaFromDescription(event.description) || event.summary;
    if (inferred) {
      const byName = categories.find(cat => cat.name.toLowerCase() === inferred.toLowerCase());
      if (byName) {
        return { backgroundColor: `hsl(var(--category-${byName.color}))` };
      }
    }

    // 3) Safe theme fallback (no raw hex)
    return { backgroundColor: 'hsl(var(--time-passing))' };
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

  const handleDragOver = (e: React.DragEvent, dateIndex: number, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverSlot({ dateIndex, hour });
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = async (e: React.DragEvent, dateIndex: number, hour: number) => {
    e.preventDefault();
    setDragOverSlot(null);
    if (!onDropTask) return;
    try {
      const taskData = e.dataTransfer.getData('application/json');
      if (!taskData) return;
      const task: Task = JSON.parse(taskData);
      await onDropTask(task, dates[dateIndex], hour);
    } catch (error) {
      console.error('Drop error:', error);
    }
  };

  const currentTimePosition = useMemo(() => {
    const now = new Date();
    const todayIndex = dates.findIndex(d => isSameDay(d, now));
    if (todayIndex === -1) return null;
    const currentHourFrac = now.getHours() + now.getMinutes() / 60;
    // Hide indicator if current time is in a hidden sleep hour
    const currentHourInt = Math.floor(currentHourFrac);
    if (!HOURS.includes(currentHourInt)) return null;
    return { index: todayIndex, top: hourToPixel(currentHourFrac) };
  }, [dates, HOURS, hourToPixel]);

  // Calculate max all-day events height
  const maxAllDayEvents = Math.max(
    1,
    ...dates.map(date => getAllDayEventsForDay(date).length)
  );
  const allDayHeight = maxAllDayEvents * 24 + 8;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with day names */}
      <div className="flex border-b border-border bg-background sticky top-0 z-20">
        <div className="w-16 flex-shrink-0" /> {/* Time column spacer */}
        {dates.map((date, i) => {
          const isToday = isSameDay(date, new Date());
          return (
            <div
              key={i}
              className={cn(
                "flex-1 text-center py-2 border-l border-border",
                isToday && "bg-primary/5"
              )}
            >
              <div className="text-xs text-muted-foreground">
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

      {/* All-day events row */}
      <div className="flex border-b border-border bg-muted/30" style={{ minHeight: allDayHeight }}>
        <div className="w-16 flex-shrink-0 text-xs text-muted-foreground p-1">
          All day
        </div>
        {dates.map((date, i) => {
          const allDayEvents = getAllDayEventsForDay(date);
          return (
            <div key={i} className="flex-1 border-l border-border p-0.5 space-y-0.5">
              {allDayEvents.map((event) => (
                <div
                  key={event.id}
                  className="text-xs px-1 py-0.5 rounded truncate text-white cursor-pointer hover:opacity-80 transition-opacity"
                  style={getEventColor(event)}
                  onClick={() => handleEventClick(event)}
                >
                  {event.summary}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-auto" ref={scrollContainerRef}>
        <div className="flex" style={{ height: HOURS.length * HOUR_HEIGHT }}>
          {/* Time labels column */}
          <div className="w-16 flex-shrink-0 relative">
            {HOURS.map((hour, index) => (
              <div
                key={hour}
                className="absolute w-full text-right pr-2 text-xs text-muted-foreground"
                style={{ top: index * HOUR_HEIGHT - 6 }}
              >
                {index > 0 && format(setMinutes(setHours(new Date(), hour), 0), 'h a')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {dates.map((date, dateIndex) => {
            const dayEvents = getEventsForDay(date);
            const eventLayout = getOverlapLayout(dayEvents, date);
            const isToday = isSameDay(date, new Date());

            return (
              <div
                key={dateIndex}
                className={cn(
                  "flex-1 relative border-l border-border",
                  isToday && "bg-primary/5"
                )}
              >
                {/* Hour slots as drop zones */}
                {HOURS.map((hour, index) => {
                  const isHovered = dragOverSlot?.dateIndex === dateIndex && dragOverSlot?.hour === hour;
                  return (
                    <div
                      key={hour}
                      className={cn(
                        "absolute w-full border-t border-border/50 transition-colors",
                        isHovered && "bg-primary/20"
                      )}
                      style={{ top: index * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                      onDragOver={(e) => handleDragOver(e, dateIndex, hour)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, dateIndex, hour)}
                      onClick={() => {
                        if (onSlotClick) {
                          const timeStr = `${String(hour).padStart(2, '0')}:00`;
                          onSlotClick(date, timeStr);
                        }
                      }}
                      role="button"
                      tabIndex={-1}
                    />
                  );
                })}

                {/* Events with overlap handling */}
                {eventLayout.map(({ event, top, height, column, totalColumns }) => {
                  const widthPercent = 100 / totalColumns;
                  const leftPercent = column * widthPercent;
                  
                  return (
                    <motion.div
                      key={event.id}
                      className="absolute rounded px-1 py-0.5 overflow-hidden cursor-pointer text-white shadow-sm hover:shadow-md transition-shadow text-xs"
                      style={{ 
                        top, 
                        height, 
                        minHeight: 18,
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
                      <div className="font-medium truncate">{event.summary}</div>
                      {height > 32 && (
                        <div className="opacity-80 truncate">
                          {format(parseISO(event.start), 'h:mm a')}
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {/* Current time indicator */}
                {currentTimePosition && currentTimePosition.index === dateIndex && (
                  <div
                    className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                    style={{ top: currentTimePosition.top }}
                  >
                    <div className="w-2 h-2 rounded-full bg-destructive -ml-1" />
                    <div className="flex-1 h-0.5 bg-destructive" />
                  </div>
                )}
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
      />
    </div>
  );
}
