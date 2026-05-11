import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, differenceInCalendarDays } from 'date-fns';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  archived: boolean;
  created_at: string;
  importance_reason?: string | null;
  importance_set_at?: string | null;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completion_date: string;
  completed: boolean;
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchHabits = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('archived', false)
      .order('sort_order', { ascending: true });

    if (error) {
      toast({ title: 'Error loading habits', variant: 'destructive' });
      return;
    }
    setHabits((data as unknown as Habit[]) || []);
  }, [toast]);

  const fetchCompletions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch last 90 days of completions for streak calculation
    const since = format(subDays(new Date(), 90), 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .gte('completion_date', since);

    if (error) return;
    setCompletions((data as unknown as HabitCompletion[]) || []);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchHabits(), fetchCompletions()]);
      setLoading(false);
    };
    load();
  }, [fetchHabits, fetchCompletions]);

  const addHabit = async (name: string, icon: string, color: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('habits').insert({
      user_id: user.id,
      name,
      icon,
      color,
      sort_order: habits.length,
    });

    if (error) {
      toast({ title: 'Error adding habit', variant: 'destructive' });
      return;
    }
    await fetchHabits();
  };

  const updateHabit = async (habitId: string, updates: { name?: string; icon?: string; color?: string; importance_reason?: string | null; importance_set_at?: string | null }) => {
    const { error } = await supabase.from('habits').update(updates).eq('id', habitId);
    if (error) {
      toast({ title: 'Error updating habit', variant: 'destructive' });
      return;
    }
    await fetchHabits();
  };

  const deleteHabit = async (habitId: string) => {
    const { error } = await supabase.from('habits').delete().eq('id', habitId);
    if (error) {
      toast({ title: 'Error deleting habit', variant: 'destructive' });
      return;
    }
    await fetchHabits();
  };

  const toggleCompletion = async (habitId: string, date: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const existing = completions.find(
      c => c.habit_id === habitId && c.completion_date === date
    );

    if (existing) {
      await supabase.from('habit_completions').delete().eq('id', existing.id);
    } else {
      await supabase.from('habit_completions').insert({
        habit_id: habitId,
        user_id: user.id,
        completion_date: date,
      });
    }
    await fetchCompletions();
  };

  const getStreak = (habitId: string): number => {
    const habitCompletions = completions
      .filter(c => c.habit_id === habitId && c.completed)
      .map(c => c.completion_date)
      .sort()
      .reverse();

    if (habitCompletions.length === 0) return 0;

    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    // Streak must include today or yesterday
    if (habitCompletions[0] !== today && habitCompletions[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < habitCompletions.length; i++) {
      const diff = differenceInCalendarDays(
        new Date(habitCompletions[i - 1]),
        new Date(habitCompletions[i])
      );
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const isCompletedOn = (habitId: string, date: string): boolean => {
    return completions.some(c => c.habit_id === habitId && c.completion_date === date && c.completed);
  };

  return {
    habits,
    loading,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleCompletion,
    getStreak,
    isCompletedOn,
  };
}
