import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useUser } from '@/contexts/UserContext';
import { GOOGLE_CALENDAR_COLORS } from '@/types/user';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated: () => void;
  defaultDate?: Date;
  defaultTime?: string;
}

export function CreateEventDialog({ 
  open, 
  onOpenChange, 
  onEventCreated,
  defaultDate,
  defaultTime 
}: CreateEventDialogProps) {
  const { categories } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [lifeArea, setLifeArea] = useState<string>('');
  const [date, setDate] = useState(defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(defaultTime || '09:00');
  const [endTime, setEndTime] = useState(defaultTime ? 
    format(new Date(`2000-01-01T${defaultTime}`).getTime() + 60 * 60 * 1000, 'HH:mm') : 
    '10:00'
  );

  const selectedCategory = categories.find(c => c.id === lifeArea);
  const colorId = selectedCategory?.googleColorId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!summary.trim()) {
      toast.error('Please enter an event title');
      return;
    }

    setIsSubmitting(true);

    try {
      const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
      const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to create events');
        return;
      }

      const response = await supabase.functions.invoke('google-calendar-create-event', {
        body: {
          summary: summary.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          start: startDateTime,
          end: endDateTime,
          colorId: colorId || undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create event');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success('Event created in Google Calendar');
      
      // Reset form
      setSummary('');
      setDescription('');
      setLocation('');
      setLifeArea('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setStartTime('09:00');
      setEndTime('10:00');
      
      onOpenChange(false);
      onEventCreated();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
            <DialogDescription>
              Add a new event to your Google Calendar
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="summary">Title</Label>
              <Input
                id="summary"
                placeholder="Event title"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
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

            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                placeholder="Add location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
