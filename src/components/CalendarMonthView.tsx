import { useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isWithinInterval } from 'date-fns';
import { CalendarEvent } from '@/hooks/useGoogleCalendar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CalendarMonthViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onDateClick?: (date: Date) => void;
}

const MAX_VISIBLE_EVENTS = 3;

export function CalendarMonthView({ events, currentDate, onDateClick }: CalendarMonthViewProps) {
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    const weeksArr: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeksArr.push(days.slice(i, i + 7));
    }
    return weeksArr;
  }, [currentDate]);

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventStart = parseISO(event.start);
      const eventEnd = parseISO(event.end);
      
      if (event.allDay) {
        return isSameDay(eventStart, date) || 
          isWithinInterval(date, { start: eventStart, end: addDays(eventEnd, -1) });
      }
      
      return isSameDay(eventStart, date);
    });
  };

  const getEventColor = (event: CalendarEvent) => {
    const colors: Record<string, string> = {
      '1': 'bg-blue-500',
      '2': 'bg-green-500',
      '3': 'bg-purple-500',
      '4': 'bg-red-500',
      '5': 'bg-yellow-500',
      '6': 'bg-orange-500',
      '7': 'bg-cyan-500',
      '8': 'bg-gray-500',
      '9': 'bg-indigo-500',
      '10': 'bg-emerald-500',
      '11': 'bg-pink-500',
    };
    return event.colorId && colors[event.colorId] ? colors[event.colorId] : 'bg-primary';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-rows-5 md:grid-rows-6">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-border last:border-b-0">
            {week.map((date, dayIndex) => {
              const isCurrentMonth = isSameMonth(date, currentDate);
              const isToday = isSameDay(date, new Date());
              const dayEvents = getEventsForDay(date);
              const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
              const moreCount = dayEvents.length - MAX_VISIBLE_EVENTS;

              return (
                <motion.div
                  key={dayIndex}
                  className={cn(
                    "min-h-[80px] md:min-h-[100px] p-1 border-r border-border last:border-r-0 cursor-pointer hover:bg-accent/50 transition-colors",
                    !isCurrentMonth && "bg-muted/30",
                    isToday && "bg-primary/5"
                  )}
                  onClick={() => onDateClick?.(date)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className={cn(
                    "text-sm mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                    !isCurrentMonth && "text-muted-foreground/50",
                    isToday && "bg-primary text-primary-foreground font-bold"
                  )}>
                    {format(date, 'd')}
                  </div>

                  <div className="space-y-0.5">
                    {visibleEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-[10px] md:text-xs px-1 py-0.5 rounded truncate text-white",
                          !event.colorId && event.calendarColor ? '' : getEventColor(event)
                        )}
                        style={!event.colorId && event.calendarColor ? { backgroundColor: event.calendarColor } : undefined}
                        title={event.summary}
                      >
                        {!event.allDay && (
                          <span className="opacity-80 mr-1">
                            {format(parseISO(event.start), 'h:mma').toLowerCase()}
                          </span>
                        )}
                        {event.summary}
                      </div>
                    ))}
                    {moreCount > 0 && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        +{moreCount} more
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
