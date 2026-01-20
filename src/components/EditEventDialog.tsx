import { useState, useEffect } from 'react';
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

interface EditEventDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdated: () => void;
  onEventDeleted: () => void;
}

export function EditEventDialog({ 
  event, 
  open, 
  onOpenChange, 
  onEventUpdated,
  onEventDeleted 
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

  const selectedCategory = categories.find(c => c.id === lifeArea);
  const colorId = selectedCategory?.googleColorId;

  useEffect(() => {
    if (event) {
      setSummary(event.summary || '');
      setDescription(event.description || '');
      
      // Try to match colorId to a category
      if (event.colorId) {
        const matchingCategory = categories.find(c => c.googleColorId === event.colorId);
        setLifeArea(matchingCategory?.id || '');
      } else {
        setLifeArea('');
      }
      
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

  const handleUpdate = async () => {
    if (!event || !summary.trim()) return;

    setIsUpdating(true);
    try {
      const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
      const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();

      const { error } = await supabase.functions.invoke('google-calendar-update-event', {
        body: {
          eventId: event.id,
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

  const handleDelete = async () => {
    if (!event) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('google-calendar-delete-event', {
        body: { eventId: event.id },
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
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="summary">Title</Label>
              <Input
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isUpdating || isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isUpdating || !summary.trim()}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </>
  );
}