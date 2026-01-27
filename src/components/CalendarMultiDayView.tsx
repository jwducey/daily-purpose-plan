import { useMemo, useState } from 'react';
import { format, parseISO, startOfDay, addDays, isSameDay, differenceInMinutes, setHours, setMinutes, isWithinInterval } from 'date-fns';
import { CalendarEvent } from '@/hooks/useGoogleCalendar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { EditEventDialog } from './EditEventDialog';
import { useUser } from '@/contexts/UserContext';
import { GOOGLE_CALENDAR_COLORS } from '@/types/user';

interface CalendarMultiDayViewProps {
  events: CalendarEvent[];
  startDate: Date;
  numberOfDays: number;
  onEventUpdated?: () => void;
  onEventDeleted?: () => void;
}

// Show only 6 AM to 10 PM like Google Calendar
const START_HOUR = 6;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);
const HOUR_HEIGHT = 48; // pixels per hour

export function CalendarMultiDayView({ events, startDate, numberOfDays, onEventUpdated, onEventDeleted }: CalendarMultiDayViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { categories } = useUser();

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

  const getEventPosition = (event: CalendarEvent, date: Date) => {
    const eventStart = parseISO(event.start);
    const eventEnd = parseISO(event.end);
    const dayStart = startOfDay(date);
    const viewStart = setHours(dayStart, START_HOUR);

    const displayStart = eventStart < viewStart ? viewStart : eventStart;
    const startMinutes = differenceInMinutes(displayStart, viewStart);
    const top = Math.max((startMinutes / 60) * HOUR_HEIGHT, 0);

    const viewEnd = setHours(dayStart, END_HOUR);
    const displayEnd = eventEnd > viewEnd ? viewEnd : eventEnd;
    const duration = differenceInMinutes(displayEnd, displayStart);
    const height = Math.max((duration / 60) * HOUR_HEIGHT, 20);

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

  const getEventColor = (event: CalendarEvent) => {
    // First, try to match by Google colorId to a budget category
    if (event.colorId) {
      const matchingCategory = categories.find(cat => cat.googleColorId === event.colorId);
      if (matchingCategory) {
        // Use the category's color from the budget (prefix with 'category-')
        const colorVar = `hsl(var(--category-${matchingCategory.color}))`;
        return { backgroundColor: colorVar };
      }
      // Fallback to Google Calendar color hex
      const googleColor = GOOGLE_CALENDAR_COLORS[event.colorId];
      if (googleColor) {
        return { backgroundColor: googleColor.hex };
      }
    }
    return { backgroundColor: 'hsl(var(--primary))' };
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

  const currentTimePosition = useMemo(() => {
    const now = new Date();
    const todayIndex = dates.findIndex(d => isSameDay(d, now));
    if (todayIndex === -1) return null;

    const currentHour = now.getHours();
    // Only show if within visible hours
    if (currentHour < START_HOUR || currentHour >= END_HOUR) return null;

    const dayStart = startOfDay(now);
    const viewStart = setHours(dayStart, START_HOUR);
    const minutes = differenceInMinutes(now, viewStart);
    return { index: todayIndex, top: (minutes / 60) * HOUR_HEIGHT };
  }, [dates]);

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
      <div className="flex-1 overflow-auto">
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
                {/* Hour lines */}
                {HOURS.map((hour, index) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-border/50"
                    style={{ top: index * HOUR_HEIGHT }}
                  />
                ))}

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
