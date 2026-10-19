import { useState, useEffect, useRef } from 'react';
import { CalendarEvent } from '@/hooks/useGoogleCalendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';
import { GOOGLE_CALENDAR_COLORS } from '@/types/user';
import { saveEventTag } from '@/hooks/useGoogleCalendar';

interface EditEventDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdated: () => void;
  onEventDeleted: () => void;
  allEvents?: CalendarEvent[];
}

export function EditEventDialog({ 
  event, 
  open, 
  onOpenChange, 
  onEventUpdated,
  onEventDeleted,
  allEvents = [],
}: EditEventDialogProps) {
  const { categories } = useUser();
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [lifeArea, setLifeArea] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [matchingEventCount, setMatchingEventCount] = useState(0);

  // Store original life area to detect changes
  const originalLifeAreaRef = useRef<string>('');

  const selectedCategory = categories.find(c => c.id === lifeArea);
  const colorId = selectedCategory?.googleColorId;

  useEffect(() => {
    if (event) {
      setSummary(event.summary || '');
      setDescription(event.description || '');
      
      // Try to match colorId to a category
      let matchedArea = '';
      if (event.colorId) {
        const matchingCategory = categories.find(c => c.googleColorId === event.colorId);
        matchedArea = matchingCategory?.id || '';
      }
      setLifeArea(matchedArea);
      originalLifeAreaRef.current = matchedArea;
      
      if (!event.allDay) {
        const start = parseISO(event.start);
        const end = parseISO(event.end);
        setStartDate(format(start, 'yyyy-MM-dd'));
        setStartTime(format(start, 'HH:mm'));
        setEndDate(format(end, 'yyyy-MM-dd'));
        setEndTime(format(end, 'HH:mm'));
      } else {
        setStartDate(event.start.split('T')[0]);
        setEndDate(event.end.split('T')[0]);
        setStartTime('09:00');
        setEndTime('10:00');
      }
    }
  }, [event, categories]);

  const lifeAreaChanged = lifeArea !== originalLifeAreaRef.current;

  const getMatchingEvents = () => {
    if (!event) return [];
    const normalizedTitle = (event.summary || '').trim().toLowerCase();
    return allEvents.filter(e => 
      e.id !== event.id && 
      (e.summary || '').trim().toLowerCase() === normalizedTitle
    );
  };

  const updateSingleEvent = async () => {
    if (!event || !summary.trim()) return;
    if (event.readOnly) {
      try {
        await saveEventTag(event, colorId || null);
        toast.success('Life area tagged in the app');
        onEventUpdated();
        onOpenChange(false);
      } catch (e) {
        console.error(e);
        toast.error('Failed to save life area');
      }
      return;
    }

    setIsUpdating(true);
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
      const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();

      const { error } = await supabase.functions.invoke('google-calendar-update-event', {
        body: {
          eventId: event.id,
          calendarId: event.calendarId,
          summary: summary.trim(),
          description: description.trim() || undefined,
          start: startDateTime,
          end: endDateTime,
          colorId: colorId || undefined,
        },
      });

      if (error) throw error;

      toast.success('Event updated');
      onEventUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    } finally {
      setIsUpdating(false);
    }
  };

  const updateMatchingEvents = async (matchingEvents: CalendarEvent[]) => {
    const eventIds = matchingEvents.filter(e => !e.calendarId || e.calendarId === 'primary').map(e => e.id);
    if (eventIds.length === 0) return 0;
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-batch-update', {
        body: {
          eventIds,
          colorId: colorId || undefined,
        },
      });
      if (error) {
        console.error('Batch update error:', error);
        return 0;
      }
      return data?.updated || 0;
    } catch (err) {
      console.error('Batch update failed:', err);
      return 0;
    }
  };

  const handleSave = async () => {
    if (!event || !summary.trim()) return;
    if (event.readOnly) {
      try {
        await saveEventTag(event, colorId || null);
        toast.success('Life area tagged in the app');
        onEventUpdated();
        onOpenChange(false);
      } catch (e) {
        console.error(e);
        toast.error('Failed to save life area');
      }
      return;
    }

    // Check if life area changed and there are matching events
    if (lifeAreaChanged) {
      const matching = getMatchingEvents();
      if (matching.length > 0) {
        setMatchingEventCount(matching.length);
        setShowBatchConfirm(true);
        return;
      }
    }

    await updateSingleEvent();
  };

  const handleBatchConfirm = async (updateAll: boolean) => {
    setShowBatchConfirm(false);
    setIsUpdating(true);

    try {
      // Always update the current event first
      const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
      const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();

      const { error } = await supabase.functions.invoke('google-calendar-update-event', {
        body: {
          eventId: event!.id,
          calendarId: event!.calendarId,
          summary: summary.trim(),
          description: description.trim() || undefined,
          start: startDateTime,
          end: endDateTime,
          colorId: colorId || undefined,
        },
      });

      if (error) throw error;

      // Close dialog immediately and refresh calendar
      onEventUpdated();
      onOpenChange(false);
      setIsUpdating(false);

      if (updateAll) {
        const matching = getMatchingEvents();
        toast.info(`Updating ${matching.length} other events in the background...`);
        // Fire-and-forget: batch update runs in background
        updateMatchingEvents(matching).then((count) => {
          toast.success(`Updated ${count} other event${count !== 1 ? 's' : ''}`);
          onEventUpdated(); // Refresh calendar again when done
        }).catch(() => {
          toast.error('Some background updates failed');
        });
      } else {
        toast.success('Event updated');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    if (event.readOnly) {
      toast.error("This event is from a shared calendar and can't be changed here");
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('google-calendar-delete-event', {
        body: { eventId: event.id, calendarId: event.calendarId },
      });

      if (error) throw error;

      toast.success('Event deleted');
      onEventDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!event) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            {event?.readOnly && (
              <p className="text-sm text-muted-foreground">
                This event is from a shared calendar. Only the life area can be set, and it shows in this app only.
              </p>
            )}
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="summary">Title</Label>
              <Input
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                  disabled={!!event?.readOnly}
                placeholder="Event title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lifeArea">Life Area</Label>
              <Select value={lifeArea} onValueChange={setLifeArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Select life area (optional)">
                    {selectedCategory && (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: GOOGLE_CALENDAR_COLORS[selectedCategory.googleColorId]?.hex }}
                        />
                        {selectedCategory.name}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: GOOGLE_CALENDAR_COLORS[category.googleColorId]?.hex }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                  disabled={!!event?.readOnly}
                placeholder="Event description"
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={!!event?.readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={!!event?.readOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={!!event?.readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={!!event?.readOnly}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            {event?.readOnly ? <span /> : (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isUpdating || isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdating || !summary.trim()}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{event.summary}"? This will remove it from your Google Calendar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch update life area confirmation */}
      <AlertDialog open={showBatchConfirm} onOpenChange={setShowBatchConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Life Area for All "{event.summary}" Events?</AlertDialogTitle>
            <AlertDialogDescription>
              There {matchingEventCount === 1 ? 'is' : 'are'} {matchingEventCount} other event{matchingEventCount !== 1 ? 's' : ''} with the same name. 
              Would you like to update the life area for all of them too?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:gap-0">
            <AlertDialogCancel onClick={() => handleBatchConfirm(false)} disabled={isUpdating}>
              Just This One
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleBatchConfirm(true)} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update All ({matchingEventCount + 1})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
