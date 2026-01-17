import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const LIFE_AREAS = [
  { value: 'health', label: 'Health', color: 'bg-green-500' },
  { value: 'wealth', label: 'Wealth', color: 'bg-amber-500' },
  { value: 'relationships', label: 'Relationships', color: 'bg-pink-500' },
  { value: 'growth', label: 'Growth', color: 'bg-purple-500' },
  { value: 'career', label: 'Career', color: 'bg-blue-500' },
  { value: 'leisure', label: 'Leisure', color: 'bg-cyan-500' },
] as const;

export type LifeArea = typeof LIFE_AREAS[number]['value'];

export const TIME_ESTIMATES = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
  { value: 480, label: 'Full day' },
] as const;

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: number;
  completed: boolean;
  completed_at: string | null;
  project: string | null;
  labels: string[] | null;
  sort_order: number;
  time_estimate_minutes: number | null;
  life_area: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  due_date?: string;
  priority?: number;
  project?: string;
  labels?: string[];
  time_estimate_minutes?: number;
  life_area?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  priority?: number;
  completed?: boolean;
  project?: string | null;
  labels?: string[];
  sort_order?: number;
  time_estimate_minutes?: number | null;
  life_area?: string | null;
}

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('completed', { ascending: true })
        .order('priority', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createTask = useCallback(async (input: CreateTaskInput): Promise<Task | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description || null,
          due_date: input.due_date || null,
          priority: input.priority || 4,
          project: input.project || null,
          labels: input.labels || null,
          time_estimate_minutes: input.time_estimate_minutes || null,
          life_area: input.life_area || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => [...prev, data]);
      toast.success('Task created');
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
      return null;
    }
  }, [user]);

  const updateTask = useCallback(async (id: string, input: UpdateTaskInput): Promise<boolean> => {
    try {
      const updateData: any = { ...input };
      
      // Set completed_at when completing a task
      if (input.completed === true) {
        updateData.completed_at = new Date().toISOString();
      } else if (input.completed === false) {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updateData } : task
      ));
      
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      return false;
    }
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
      toast.success('Task deleted');
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
      return false;
    }
  }, []);

  const toggleComplete = useCallback(async (id: string): Promise<boolean> => {
    const task = tasks.find(t => t.id === id);
    if (!task) return false;

    return updateTask(id, { completed: !task.completed });
  }, [tasks, updateTask]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
  };
}
