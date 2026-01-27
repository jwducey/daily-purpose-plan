import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export interface Contact {
  id: string;
  name: string;
  notes?: string;
  is_high_value: boolean;
  last_connected_at?: string;
  created_at: string;
}

export interface DailyReview {
  id: string;
  review_date: string;
  followed_schedule?: boolean;
  reflection_notes?: string;
  created_at: string;
}

export interface ReviewActivity {
  id: string;
  review_id: string;
  activity_description: string;
  life_area?: string;
  duration_minutes?: number;
  was_planned: boolean;
}

export interface ReviewConnection {
  id: string;
  review_id: string;
  contact_id?: string;
  contact_name: string;
  connection_notes?: string;
}

export function useDailyReview() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [todayReview, setTodayReview] = useState<DailyReview | null>(null);
  const [activities, setActivities] = useState<ReviewActivity[]>([]);
  const [connections, setConnections] = useState<ReviewConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [staleContacts, setStaleContacts] = useState<Contact[]>([]);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching contacts:', error);
      return;
    }
    
    setContacts(data || []);
    
    // Find high-value contacts not connected with in 14+ days
    const stale = (data || []).filter(contact => {
      if (!contact.is_high_value) return false;
      if (!contact.last_connected_at) return true;
      return differenceInDays(new Date(), new Date(contact.last_connected_at)) >= 14;
    });
    setStaleContacts(stale);
  }, [user]);

  // Fetch today's review
  const fetchTodayReview = useCallback(async () => {
    if (!user) return;
    
    const { data: review, error } = await supabase
      .from('daily_reviews')
      .select('*')
      .eq('review_date', today)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching review:', error);
      return;
    }
    
    setTodayReview(review);
    
    if (review) {
      // Fetch activities and connections for this review
      const [activitiesRes, connectionsRes] = await Promise.all([
        supabase.from('review_activities').select('*').eq('review_id', review.id),
        supabase.from('review_connections').select('*').eq('review_id', review.id),
      ]);
      
      setActivities(activitiesRes.data || []);
      setConnections(connectionsRes.data || []);
    }
  }, [user, today]);

  useEffect(() => {
    if (user) {
      Promise.all([fetchContacts(), fetchTodayReview()]).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [user, fetchContacts, fetchTodayReview]);

  // Create or get today's review
  const getOrCreateTodayReview = async (): Promise<string | null> => {
    if (!user) return null;
    
    if (todayReview) return todayReview.id;
    
    const { data, error } = await supabase
      .from('daily_reviews')
      .insert({ user_id: user.id, review_date: today })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating review:', error);
      toast.error('Failed to create review');
      return null;
    }
    
    setTodayReview(data);
    return data.id;
  };

  // Update review
  const updateReview = async (updates: Partial<DailyReview>) => {
    const reviewId = await getOrCreateTodayReview();
    if (!reviewId) return;
    
    const { error } = await supabase
      .from('daily_reviews')
      .update(updates)
      .eq('id', reviewId);
    
    if (error) {
      console.error('Error updating review:', error);
      toast.error('Failed to save');
      return;
    }
    
    setTodayReview(prev => prev ? { ...prev, ...updates } : null);
  };

  // Add activity
  const addActivity = async (activity: Omit<ReviewActivity, 'id' | 'review_id'>) => {
    if (!user) return;
    
    const reviewId = await getOrCreateTodayReview();
    if (!reviewId) return;
    
    const { data, error } = await supabase
      .from('review_activities')
      .insert({ ...activity, review_id: reviewId, user_id: user.id })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding activity:', error);
      toast.error('Failed to add activity');
      return;
    }
    
    setActivities(prev => [...prev, data]);
    toast.success('Activity added');
  };

  // Add connection (and optionally create/update contact)
  const addConnection = async (
    contactName: string,
    notes?: string,
    isHighValue?: boolean
  ) => {
    if (!user) return;
    
    const reviewId = await getOrCreateTodayReview();
    if (!reviewId) return;
    
    // Check if contact exists
    let contact = contacts.find(c => c.name.toLowerCase() === contactName.toLowerCase());
    
    if (!contact) {
      // Create new contact
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({ 
          user_id: user.id, 
          name: contactName,
          is_high_value: isHighValue || false,
          last_connected_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (contactError) {
        console.error('Error creating contact:', contactError);
      } else {
        contact = newContact;
        setContacts(prev => [...prev, newContact]);
      }
    } else {
      // Update last connected time
      await supabase
        .from('contacts')
        .update({ 
          last_connected_at: new Date().toISOString(),
          is_high_value: isHighValue !== undefined ? isHighValue : contact.is_high_value
        })
        .eq('id', contact.id);
      
      setContacts(prev => prev.map(c => 
        c.id === contact!.id 
          ? { ...c, last_connected_at: new Date().toISOString(), is_high_value: isHighValue ?? c.is_high_value }
          : c
      ));
    }
    
    // Add connection record
    const { data, error } = await supabase
      .from('review_connections')
      .insert({ 
        review_id: reviewId, 
        user_id: user.id,
        contact_id: contact?.id,
        contact_name: contactName,
        connection_notes: notes
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding connection:', error);
      toast.error('Failed to add connection');
      return;
    }
    
    setConnections(prev => [...prev, data]);
    toast.success(`Connected with ${contactName}`);
    
    // Refresh stale contacts
    fetchContacts();
  };

  // Update contact high-value status
  const updateContactHighValue = async (contactId: string, isHighValue: boolean) => {
    const { error } = await supabase
      .from('contacts')
      .update({ is_high_value: isHighValue })
      .eq('id', contactId);
    
    if (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update');
      return;
    }
    
    setContacts(prev => prev.map(c => 
      c.id === contactId ? { ...c, is_high_value: isHighValue } : c
    ));
    fetchContacts();
  };

  return {
    contacts,
    todayReview,
    activities,
    connections,
    staleContacts,
    isLoading,
    updateReview,
    addActivity,
    addConnection,
    updateContactHighValue,
    fetchContacts,
    fetchTodayReview,
  };
}
