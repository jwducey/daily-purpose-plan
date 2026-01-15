import { useMemo } from 'react';
import { format, parseISO, startOfDay, addDays, isSameDay, differenceInMinutes, setHours, setMinutes, isWithinInterval } from 'date-fns';
import { CalendarEvent } from '@/hooks/useGoogleCalendar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CalendarMultiDayViewProps {
  events: CalendarEvent[];
  startDate: Date;
  numberOfDays: number;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 48; // pixels per hour

export function CalendarMultiDayView({ events, startDate, numberOfDays }: CalendarMultiDayViewProps) {
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

    const displayStart = eventStart < dayStart ? dayStart : eventStart;
    const startMinutes = differenceInMinutes(displayStart, dayStart);
    const top = (startMinutes / 60) * HOUR_HEIGHT;

    const dayEnd = addDays(dayStart, 1);
    const displayEnd = eventEnd > dayEnd ? dayEnd : eventEnd;
    const duration = differenceInMinutes(displayEnd, displayStart);
    const height = Math.max((duration / 60) * HOUR_HEIGHT, 20);

    return { top, height };
  };

  const getEventColor = (event: CalendarEvent) => {
    const colors: Record<string, string> = {
      '1': 'bg-blue-500/90',
      '2': 'bg-green-500/90',
      '3': 'bg-purple-500/90',
      '4': 'bg-red-500/90',
      '5': 'bg-yellow-500/90',
      '6': 'bg-orange-500/90',
      '7': 'bg-cyan-500/90',
      '8': 'bg-gray-500/90',
      '9': 'bg-indigo-500/90',
      '10': 'bg-emerald-500/90',
      '11': 'bg-pink-500/90',
    };
    return event.colorId && colors[event.colorId] ? colors[event.colorId] : 'bg-primary/90';
  };

  const currentTimePosition = useMemo(() => {
    const now = new Date();
    const todayIndex = dates.findIndex(d => isSameDay(d, now));
    if (todayIndex === -1) return null;

    const dayStart = startOfDay(now);
    const minutes = differenceInMinutes(now, dayStart);
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
                  className={cn(
                    "text-xs px-1 py-0.5 rounded truncate text-white",
                    getEventColor(event)
                  )}
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
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full text-right pr-2 text-xs text-muted-foreground"
                style={{ top: hour * HOUR_HEIGHT - 6 }}
              >
                {hour > 0 && format(setMinutes(setHours(new Date(), hour), 0), 'h a')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {dates.map((date, dateIndex) => {
            const dayEvents = getEventsForDay(date);
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
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-border/50"
                    style={{ top: hour * HOUR_HEIGHT }}
                  />
                ))}

                {/* Events */}
                {dayEvents.map((event) => {
                  const { top, height } = getEventPosition(event, date);
                  return (
                    <motion.div
                      key={event.id}
                      className={cn(
                        "absolute left-0.5 right-0.5 rounded px-1 py-0.5 overflow-hidden cursor-pointer",
                        "text-white shadow-sm hover:shadow-md transition-shadow text-xs",
                        getEventColor(event)
                      )}
                      style={{ top, height, minHeight: 18 }}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
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
    </div>
  );
}
