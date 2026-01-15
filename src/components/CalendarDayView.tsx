import { useMemo, useState } from 'react';
import { format, parseISO, startOfDay, addDays, isSameDay, isWithinInterval, differenceInMinutes, setHours, setMinutes } from 'date-fns';
import { CalendarEvent } from '@/hooks/useGoogleCalendar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CalendarDayViewProps {
  events: CalendarEvent[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // pixels per hour

export function CalendarDayView({ events, isLoading, onRefresh }: CalendarDayViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dayEvents = useMemo(() => {
    const dayStart = startOfDay(selectedDate);
    const dayEnd = addDays(dayStart, 1);

    return events.filter((event) => {
      const eventStart = parseISO(event.start);
      const eventEnd = parseISO(event.end);
      
      // Check if event overlaps with the selected day
      return (
        isSameDay(eventStart, selectedDate) ||
        isSameDay(eventEnd, selectedDate) ||
        (eventStart < dayStart && eventEnd > dayEnd)
      );
    });
  }, [events, selectedDate]);

  const allDayEvents = useMemo(() => {
    return dayEvents.filter((event) => event.allDay);
  }, [dayEvents]);

  const timedEvents = useMemo(() => {
    return dayEvents.filter((event) => !event.allDay);
  }, [dayEvents]);

  const getEventPosition = (event: CalendarEvent) => {
    const eventStart = parseISO(event.start);
    const eventEnd = parseISO(event.end);
    const dayStart = startOfDay(selectedDate);

    // Clamp start time to day start
    const displayStart = eventStart < dayStart ? dayStart : eventStart;
    const startMinutes = differenceInMinutes(displayStart, dayStart);
    const top = (startMinutes / 60) * HOUR_HEIGHT;

    // Clamp end time to day end
    const dayEnd = addDays(dayStart, 1);
    const displayEnd = eventEnd > dayEnd ? dayEnd : eventEnd;
    const duration = differenceInMinutes(displayEnd, displayStart);
    const height = Math.max((duration / 60) * HOUR_HEIGHT, 24); // Minimum height

    return { top, height };
  };

  const currentTimePosition = useMemo(() => {
    const now = new Date();
    if (!isSameDay(now, selectedDate)) return null;
    
    const dayStart = startOfDay(selectedDate);
    const minutes = differenceInMinutes(now, dayStart);
    return (minutes / 60) * HOUR_HEIGHT;
  }, [selectedDate]);

  const goToPreviousDay = () => setSelectedDate(addDays(selectedDate, -1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  const isToday = isSameDay(selectedDate, new Date());

  // Get event color based on colorId or default
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

  return (
    <motion.div 
      className="flex flex-col h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant={isToday ? "default" : "outline"} 
            size="sm" 
            onClick={goToToday}
          >
            Today
          </Button>
        </div>
        
        <h2 className="font-serif text-lg md:text-xl">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h2>

        {onRefresh && (
          <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        )}
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="p-2 border-b border-border bg-muted/30">
          <div className="text-xs text-muted-foreground mb-1 ml-16">All day</div>
          <div className="flex flex-wrap gap-1 ml-16">
            {allDayEvents.map((event) => (
              <div
                key={event.id}
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium text-white",
                  getEventColor(event)
                )}
              >
                {event.summary}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <div className="flex-1 overflow-auto">
        <div className="relative" style={{ height: HOURS.length * HOUR_HEIGHT }}>
          {/* Hour lines and labels */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute w-full border-t border-border/50"
              style={{ top: hour * HOUR_HEIGHT }}
            >
              <span className="absolute -top-3 left-2 text-xs text-muted-foreground w-12">
                {format(setMinutes(setHours(new Date(), hour), 0), 'h a')}
              </span>
            </div>
          ))}

          {/* Events container */}
          <div className="absolute left-16 right-4 top-0 bottom-0">
            {timedEvents.map((event) => {
              const { top, height } = getEventPosition(event);
              return (
                <motion.div
                  key={event.id}
                  className={cn(
                    "absolute left-0 right-0 rounded-lg px-2 py-1 overflow-hidden cursor-pointer",
                    "text-white shadow-sm hover:shadow-md transition-shadow",
                    getEventColor(event)
                  )}
                  style={{ top, height, minHeight: 24 }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="text-xs font-semibold truncate">{event.summary}</div>
                  {height > 40 && (
                    <div className="text-xs opacity-90">
                      {format(parseISO(event.start), 'h:mm a')} - {format(parseISO(event.end), 'h:mm a')}
                    </div>
                  )}
                  {height > 60 && event.location && (
                    <div className="text-xs opacity-75 truncate">{event.location}</div>
                  )}
                </motion.div>
              );
            })}

            {/* Current time indicator */}
            {currentTimePosition !== null && (
              <div
                className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                style={{ top: currentTimePosition }}
              >
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <div className="flex-1 h-0.5 bg-destructive" />
              </div>
            )}
          </div>

          {/* Empty state overlay */}
          {dayEvents.length === 0 && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No events for this day</p>
                <p className="text-sm">Your schedule is open!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
