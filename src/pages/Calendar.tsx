import { Navigation } from '@/components/Navigation';
import { CalendarDayView } from '@/components/CalendarDayView';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, LogIn, Loader2 } from 'lucide-react';

export default function Calendar() {
  const { user } = useAuth();
  const { events, isConnected, isLoading, fetchEvents } = useGoogleCalendar();

  const handleRefresh = async () => {
    const now = new Date();
    const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();
    await fetchEvents(timeMin, timeMax);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Navigation />
      
      <main className="flex-1 pb-20 md:pb-0 flex flex-col">
        {!user ? (
          <div className="flex-1 flex items-center justify-center p-6">
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
          </div>
        ) : !isConnected ? (
          <div className="flex-1 flex items-center justify-center p-6">
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
          </div>
        ) : (
          <CalendarDayView 
            events={events} 
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        )}
      </main>
    </div>
  );
}
