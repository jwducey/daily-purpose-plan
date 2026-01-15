import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Check, Loader2, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useAuth } from '@/hooks/useAuth';

export function GoogleCalendarSettings() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    isConnected,
    isLoading,
    isConnecting,
    events,
    connect,
    disconnect,
    handleCallback,
  } = useGoogleCalendar();

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const isCallback = searchParams.get('google_callback');
    
    if (code && isCallback && user) {
      // Clear URL params
      setSearchParams({});
      handleCallback(code);
    }
  }, [searchParams, setSearchParams, handleCallback, user]);

  if (!user) {
    return (
      <motion.div
        className="p-6 rounded-2xl bg-card shadow-card space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-lg">Google Calendar</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Please sign in to connect Google Calendar.
        </p>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <motion.div
        className="p-6 rounded-2xl bg-card shadow-card space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-lg">Google Calendar</h2>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Checking connection...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="p-6 rounded-2xl bg-card shadow-card space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-500/10' : 'bg-muted'}`}>
          <Calendar className={`w-5 h-5 ${isConnected ? 'text-green-500' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1">
          <h2 className="font-serif text-lg">Google Calendar</h2>
          {isConnected && (
            <p className="text-sm text-green-500 flex items-center gap-1">
              <Check className="w-3 h-3" /> Connected
            </p>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {isConnected 
          ? 'Your calendar events will be used to track how you spend your time.'
          : 'Connect your Google Calendar to automatically import your events and track time spent.'}
      </p>

      {isConnected && events.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground mb-2">
            Upcoming events ({events.length}):
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {events.slice(0, 5).map((event) => (
              <div 
                key={event.id}
                className="text-sm p-2 bg-muted/50 rounded-lg"
              >
                <p className="font-medium truncate">{event.summary}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.start).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2">
        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={disconnect}
            className="text-destructive hover:text-destructive"
          >
            <Unlink className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={connect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Connect Google Calendar
              </>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
