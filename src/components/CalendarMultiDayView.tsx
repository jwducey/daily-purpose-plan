import { useMemo, useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { format, parseISO, startOfDay, addDays, isSameDay, differenceInMinutes, setHours, setMinutes, isWithinInterval, addMinutes } from 'date-fns';
import { CalendarEvent } from '@/hooks/useGoogleCalendar';
import { Task } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { EditEventDialog } from './EditEventDialog';
import { useUser } from '@/contexts/UserContext';
import { GOOGLE_CALENDAR_COLORS } from '@/types/user';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CalendarMultiDayViewProps {
  events: CalendarEvent[];
  startDate: Date;
  numberOfDays: number;
  onEventUpdated?: () => void;
  onEventDeleted?: () => void;
  onDropTask?: (task: Task, date: Date, hour: number) => Promise<void>;
  onSlotClick?: (date: Date, time: string) => void;
}

const HOUR_HEIGHT = 48;

export function CalendarMultiDayView({ events, startDate, numberOfDays, onEventUpdated, onEventDeleted, onDropTask, onSlotClick }: CalendarMultiDayViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [dragOverSlot, setDragOverSlot] = useState<{ dateIndex: number; hour: number } | null>(null);
  const { categories } = useUser();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- Event drag-to-move state ---
  const [movingEvent, setMovingEvent] = useState<CalendarEvent | null>(null);
  const [movePreview, setMovePreview] = useState<{ top: number; dateIndex: number } | null>(null);
  const moveStartY = useRef(0);
  const moveStartTop = useRef(0);
  const didDrag = useRef(false);
  const moveStartDateIndex = useRef(0);

  // --- Event resize state ---
  const [resizingEvent, setResizingEvent] = useState<CalendarEvent | null>(null);
  const [resizePreviewHeight, setResizePreviewHeight] = useState<number | null>(null);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);

  // Determine awake hours from sleep budget category
  const HOURS = useMemo(() => {
    const allHours = Array.from({ length: 24 }, (_, i) => i);
    const sleepCat = categories.find(c => c.name.toLowerCase() === 'sleep');
    const dailySleepHours = sleepCat ? Math.round(sleepCat.weeklyHoursTarget / 7) : 8;
    const bedtime = 22;
    const wakeTime = (bedtime + dailySleepHours) % 24;

    const sleepKeywords = ['sleep', 'bedtime', 'rest', 'nap'];
    const visibleDates = Array.from({ length: numberOfDays }, (_, i) => addDays(startDate, i));
    const occupiedHours = new Set<number>();
    for (const event of events) {
      if (event.allDay) continue;
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

    return allHours.filter(hour => {
      const isAwake = hour >= wakeTime && hour < bedtime;
      if (isAwake) return true;
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

  const hourToPixel = useCallback((absHour: number) => {
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
  }, [HOURS]);

  const pixelToHourFrac = useCallback((pixel: number) => {
    // Convert a pixel position back to an absolute hour (fractional)
    const slotIndex = Math.floor(pixel / HOUR_HEIGHT);
    const remainder = (pixel % HOUR_HEIGHT) / HOUR_HEIGHT;
    if (slotIndex < 0) return HOURS[0] || 0;
    if (slotIndex >= HOURS.length) return (HOURS[HOURS.length - 1] || 23) + 1;
    return HOURS[slotIndex] + remainder;
  }, [HOURS]);

  // Snap a fractional hour to nearest 15 minutes
  const snapTo15 = (hourFrac: number) => Math.round(hourFrac * 4) / 4;

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

  const getOverlapLayout = (dayEvents: CalendarEvent[], date: Date) => {
    if (dayEvents.length === 0) return [];

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

    for (const event of sortedEvents) {
      const eventStart = parseISO(event.start);
      const eventEnd = parseISO(event.end);

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
    const lifeAreaMatch = description.match(/Life Area:\s*([^\n\r]+)/i);
    if (lifeAreaMatch?.[1]) return lifeAreaMatch[1].trim();
    const dailyReviewMatch = description.match(/Daily Review Activity\s*-\s*([^\n\r(]+)/i);
    if (dailyReviewMatch?.[1]) return dailyReviewMatch[1].trim();
    return null;
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.colorId && GOOGLE_CALENDAR_COLORS[event.colorId]) {
      return { backgroundColor: GOOGLE_CALENDAR_COLORS[event.colorId].hex };
    }
    const inferred = extractLifeAreaFromDescription(event.description) || event.summary;
    if (inferred) {
      const byName = categories.find(cat => cat.name.toLowerCase() === inferred.toLowerCase());
      if (byName && GOOGLE_CALENDAR_COLORS[byName.googleColorId]) {
        return { backgroundColor: GOOGLE_CALENDAR_COLORS[byName.googleColorId].hex };
      }
    }
    return { backgroundColor: 'hsl(var(--muted))' };
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

  // --- Slot click: use exact click position to determine time ---
  const handleSlotClick = (e: React.MouseEvent, date: Date, hour: number, slotIndex: number) => {
    // Don't trigger if we were moving or resizing
    if (movingEvent || resizingEvent) return;
    if (!onSlotClick) return;
    
    // Calculate exact minutes from click position within the slot
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const yWithinSlot = e.clientY - rect.top;
    const minuteOffset = Math.floor((yWithinSlot / HOUR_HEIGHT) * 60);
    const snappedMinutes = Math.round(minuteOffset / 15) * 15;
    const totalMinutes = hour * 60 + snappedMinutes;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onSlotClick(date, timeStr);
  };

  // --- Update event via Google Calendar API ---
  const updateEventTime = async (event: CalendarEvent, newStart: Date, newEnd: Date) => {
    try {
      const { error } = await supabase.functions.invoke('google-calendar-update-event', {
        body: {
          eventId: event.id,
          start: newStart.toISOString(),
          end: newEnd.toISOString(),
        },
      });
      if (error) throw error;
      toast.success(`Updated "${event.summary}"`);
      onEventUpdated?.();
    } catch (err) {
      console.error('Error updating event time:', err);
      toast.error('Failed to update event');
    }
  };

  // --- Event Move (drag to reposition) ---
  const handleMoveStart = (e: React.MouseEvent, event: CalendarEvent, currentTop: number, dateIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    didDrag.current = false;
    setMovingEvent(event);
    moveStartY.current = e.clientY;
    moveStartTop.current = currentTop;
    moveStartDateIndex.current = dateIndex;
    setMovePreview({ top: currentTop, dateIndex });
  };

  useEffect(() => {
    if (!movingEvent) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dy = e.clientY - moveStartY.current;
      if (Math.abs(dy) > 4) didDrag.current = true;
      const newTop = Math.max(0, moveStartTop.current + dy);
      setMovePreview({ top: newTop, dateIndex: moveStartDateIndex.current });
    };

    const handleMouseUp = () => {
      if (movePreview && movingEvent) {
        const newHourFrac = snapTo15(pixelToHourFrac(movePreview.top));
        const eventStart = parseISO(movingEvent.start);
        const eventEnd = parseISO(movingEvent.end);
        const durationMin = differenceInMinutes(eventEnd, eventStart);
        
        const targetDate = dates[movePreview.dateIndex];
        const newStartHour = Math.floor(newHourFrac);
        const newStartMin = Math.round((newHourFrac - newStartHour) * 60);
        const newStart = setMinutes(setHours(startOfDay(targetDate), newStartHour), newStartMin);
        const newEnd = addMinutes(newStart, durationMin);

        // Only update if actually moved
        if (newStart.getTime() !== eventStart.getTime()) {
          updateEventTime(movingEvent, newStart, newEnd);
        }
      }
      setMovingEvent(null);
      setMovePreview(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [movingEvent, movePreview, dates, pixelToHourFrac]);

  // --- Event Resize (drag bottom edge to change duration) ---
  const handleResizeStart = (e: React.MouseEvent, event: CalendarEvent, currentHeight: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingEvent(event);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = currentHeight;
    setResizePreviewHeight(currentHeight);
  };

  useEffect(() => {
    if (!resizingEvent) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dy = e.clientY - resizeStartY.current;
      const newHeight = Math.max(HOUR_HEIGHT / 4, resizeStartHeight.current + dy); // min 15 min
      setResizePreviewHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (resizePreviewHeight != null && resizingEvent) {
        const eventStart = parseISO(resizingEvent.start);
        const eventEnd = parseISO(resizingEvent.end);
        
        // Find what date this event is on to compute position correctly
        const eventDate = startOfDay(eventStart);
        const { top } = getEventPosition(resizingEvent, eventDate);
        const newBottomPixel = top + resizePreviewHeight;
        const newEndHourFrac = snapTo15(pixelToHourFrac(newBottomPixel));
        
        const newEndHour = Math.floor(newEndHourFrac);
        const newEndMin = Math.round((newEndHourFrac - newEndHour) * 60);
        const newEnd = setMinutes(setHours(eventDate, newEndHour), newEndMin);

        if (newEnd.getTime() !== eventEnd.getTime() && newEnd > eventStart) {
          updateEventTime(resizingEvent, eventStart, newEnd);
        }
      }
      setResizingEvent(null);
      setResizePreviewHeight(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingEvent, resizePreviewHeight, pixelToHourFrac]);

  const currentTimePosition = useMemo(() => {
    const now = new Date();
    const todayIndex = dates.findIndex(d => isSameDay(d, now));
    if (todayIndex === -1) return null;
    const currentHourFrac = now.getHours() + now.getMinutes() / 60;
    const currentHourInt = Math.floor(currentHourFrac);
    if (!HOURS.includes(currentHourInt)) return null;
    return { index: todayIndex, top: hourToPixel(currentHourFrac) };
  }, [dates, HOURS, hourToPixel]);

  const maxAllDayEvents = Math.max(
    1,
    ...dates.map(date => getAllDayEventsForDay(date).length)
  );
  const allDayHeight = maxAllDayEvents * 24 + 8;

  const isInteracting = movingEvent != null || resizingEvent != null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with day names */}
      <div className="flex border-b border-border bg-background sticky top-0 z-20">
        <div className="w-16 flex-shrink-0" />
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
                        isHovered && "bg-primary/20",
                        !isInteracting && "cursor-pointer hover:bg-muted/40"
                      )}
                      style={{ top: index * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                      onDragOver={(e) => handleDragOver(e, dateIndex, hour)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, dateIndex, hour)}
                      onClick={(e) => handleSlotClick(e, date, hour, index)}
                      role="button"
                      tabIndex={-1}
                    />
                  );
                })}

                {/* Events with overlap handling */}
                {eventLayout.map(({ event, top, height, column, totalColumns }) => {
                  const widthPercent = 100 / totalColumns;
                  const leftPercent = column * widthPercent;
                  
                  const isMoving = movingEvent?.id === event.id;
                  const isResizing = resizingEvent?.id === event.id;
                  const displayTop = isMoving && movePreview ? movePreview.top : top;
                  const displayHeight = isResizing && resizePreviewHeight != null ? resizePreviewHeight : height;
                  
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "absolute rounded px-1 py-0.5 overflow-hidden text-white shadow-sm text-xs select-none",
                        !isInteracting && "cursor-grab hover:shadow-md transition-shadow",
                        isMoving && "cursor-grabbing opacity-80 z-30 shadow-lg",
                        isResizing && "z-30"
                      )}
                      style={{ 
                        top: displayTop, 
                        height: displayHeight, 
                        minHeight: 18,
                        width: `calc(${widthPercent}% - 4px)`,
                        left: `calc(${leftPercent}% + 2px)`,
                        zIndex: isMoving || isResizing ? 30 : column + 1,
                        ...getEventColor(event),
                      }}
                      onMouseDown={(e) => {
                        // Only left click, not on resize handle
                        if (e.button !== 0) return;
                        handleMoveStart(e, event, top, dateIndex);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Only open edit if we didn't drag
                        if (!didDrag.current) {
                          handleEventClick(event);
                        }
                      }}
                    >
                      <div className="font-medium truncate">{event.summary}</div>
                      {displayHeight > 32 && (
                        <div className="opacity-80 truncate">
                          {format(parseISO(event.start), 'h:mm a')}
                        </div>
                      )}
                      {/* Resize handle at bottom */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize hover:bg-white/30 rounded-b"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleResizeStart(e, event, height);
                        }}
                      />
                    </div>
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
        allEvents={events}
      />
    </div>
  );
}
