import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task } from './useTasks';
import { CalendarEvent } from './useGoogleCalendar';
import { toast } from 'sonner';

export interface ScheduleSuggestion {
  taskId: string;
  suggestedDate: Date;
  suggestedHour: number;
  reason: string;
}

export function useSchedulingSuggestions() {
  const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getSuggestions = useCallback(async (
    tasks: Task[],
    events: CalendarEvent[],
    weekStartDate: Date
  ): Promise<ScheduleSuggestion[]> => {
    setIsLoading(true);
    
    try {
      const unscheduledTasks = tasks.filter(t => !t.completed && t.time_estimate_minutes);
      
      if (unscheduledTasks.length === 0) {
        setSuggestions([]);
        return [];
      }

      const { data, error } = await supabase.functions.invoke('scheduling-suggestions', {
        body: {
          tasks: unscheduledTasks.map(t => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            time_estimate_minutes: t.time_estimate_minutes,
            life_areas: t.life_areas,
            due_date: t.due_date,
          })),
          events: events.map(e => ({
            summary: e.summary,
            start: e.start,
            end: e.end,
            allDay: e.allDay,
          })),
          weekStartDate: weekStartDate.toISOString(),
        },
      });

      if (error) throw error;

      const parsedSuggestions: ScheduleSuggestion[] = (data?.suggestions || []).map((s: any) => ({
        taskId: s.taskId,
        suggestedDate: new Date(s.suggestedDate),
        suggestedHour: s.suggestedHour,
        reason: s.reason,
      }));

      setSuggestions(parsedSuggestions);
      return parsedSuggestions;
    } catch (error) {
      console.error('Error getting scheduling suggestions:', error);
      // Don't show error toast - AI suggestions are optional
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    suggestions,
    isLoading,
    getSuggestions,
  };
}
