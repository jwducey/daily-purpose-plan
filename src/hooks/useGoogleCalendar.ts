import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean;
  colorId?: string;
  location?: string;
}

export function useGoogleCalendar() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { toast } = useToast();

  const checkConnection = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      // Try to fetch events to check if connected
      const { data, error } = await supabase.functions.invoke('google-calendar-events', {
        method: 'GET',
      });

      if (error || data?.needsAuth) {
        setIsConnected(false);
      } else {
        setIsConnected(true);
        setEvents(data?.events || []);
      }
    } catch {
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connect = async () => {
    setIsConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/settings?google_callback=true`;
      
      const { data, error } = await supabase.functions.invoke('google-auth-url', {
        body: { redirectUri },
      });

      if (error) throw error;

      if (data?.url) {
        // Store state in localStorage for verification
        localStorage.setItem('google_oauth_pending', 'true');
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error connecting:', error);
      toast({
        title: 'Connection failed',
        description: 'Failed to connect to Google Calendar. Please try again.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  const handleCallback = async (code: string) => {
    setIsConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/settings?google_callback=true`;
      
      const { data, error } = await supabase.functions.invoke('google-auth-callback', {
        body: { code, redirectUri },
      });

      if (error) throw error;

      if (data?.success) {
        setIsConnected(true);
        localStorage.removeItem('google_oauth_pending');
        toast({
          title: 'Connected!',
          description: 'Google Calendar is now connected.',
        });
        // Fetch events
        await fetchEvents();
      }
    } catch (error) {
      console.error('Callback error:', error);
      toast({
        title: 'Connection failed',
        description: 'Failed to complete Google Calendar connection.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      const { error } = await supabase.functions.invoke('google-disconnect', {
        method: 'POST',
      });

      if (error) throw error;

      setIsConnected(false);
      setEvents([]);
      toast({
        title: 'Disconnected',
        description: 'Google Calendar has been disconnected.',
      });
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect Google Calendar.',
        variant: 'destructive',
      });
    }
  };

  const fetchEvents = useCallback(async (timeMin?: string, timeMax?: string) => {
    try {
      // Build query string for time range filtering
      const queryParams: Record<string, string> = {};
      if (timeMin) queryParams.timeMin = timeMin;
      if (timeMax) queryParams.timeMax = timeMax;
      
      const queryString = new URLSearchParams(queryParams).toString();
      const functionPath = queryString ? `google-calendar-events?${queryString}` : 'google-calendar-events';
      
      const { data, error } = await supabase.functions.invoke(functionPath, {
        method: 'GET',
      });

      if (error) throw error;

      if (data?.needsAuth) {
        setIsConnected(false);
        return [];
      }

      setEvents(data?.events || []);
      return data?.events || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }, []);

  return {
    isConnected,
    isLoading,
    isConnecting,
    events,
    connect,
    disconnect,
    handleCallback,
    fetchEvents,
    checkConnection,
  };
}
