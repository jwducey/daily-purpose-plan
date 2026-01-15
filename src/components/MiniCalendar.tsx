import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  selectedRange?: { start: Date; end: Date };
  onRangeSelect?: (start: Date, end: Date) => void;
}

export function MiniCalendar({ selectedDate, onDateSelect, selectedRange, onRangeSelect }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));
  const [rangeStart, setRangeStart] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const handleDateClick = (date: Date) => {
    if (onRangeSelect) {
      if (!rangeStart) {
        setRangeStart(date);
      } else {
        const start = rangeStart < date ? rangeStart : date;
        const end = rangeStart < date ? date : rangeStart;
        onRangeSelect(start, end);
        setRangeStart(null);
      }
    }
    onDateSelect(date);
  };

  const isInRange = (date: Date) => {
    if (!selectedRange) return false;
    return date >= selectedRange.start && date <= selectedRange.end;
  };

  const isRangeStart = (date: Date) => selectedRange && isSameDay(date, selectedRange.start);
  const isRangeEnd = (date: Date) => selectedRange && isSameDay(date, selectedRange.end);

  return (
    <div className="p-3 select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-0.5">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7">
            {week.map((date, dayIndex) => {
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              const inRange = isInRange(date);
              const rangeStartDay = isRangeStart(date);
              const rangeEndDay = isRangeEnd(date);

              return (
                <button
                  key={dayIndex}
                  onClick={() => handleDateClick(date)}
                  className={cn(
                    "h-7 w-7 text-xs rounded-full flex items-center justify-center transition-colors",
                    !isCurrentMonth && "text-muted-foreground/40",
                    isCurrentMonth && "hover:bg-accent",
                    isToday && !isSelected && "text-primary font-bold",
                    isSelected && "bg-primary text-primary-foreground",
                    inRange && !isSelected && "bg-primary/20",
                    rangeStartDay && "rounded-r-none",
                    rangeEndDay && "rounded-l-none",
                    inRange && !rangeStartDay && !rangeEndDay && "rounded-none"
                  )}
                >
                  {format(date, 'd')}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
