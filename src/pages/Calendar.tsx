import { useState, useMemo, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { CalendarMultiDayView } from '@/components/CalendarMultiDayView';
import { CalendarMonthView } from '@/components/CalendarMonthView';
import { MiniCalendar } from '@/components/MiniCalendar';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
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
  RefreshCw,
  Menu
} from 'lucide-react';
import { format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, startOfWeek, startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewType, setViewType] = useState('week');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <Button onClick={goToToday} variant="outline" className="w-full">
          Today
        </Button>
      </div>
      <MiniCalendar
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        selectedRange={visibleRange}
      />
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
              <SheetContent side="left" className="w-72 p-0">
                <SidebarContent />
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
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Desktop sidebar */}
          <div className="hidden lg:block w-64 border-r border-border flex-shrink-0 overflow-auto">
            <SidebarContent />
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
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
