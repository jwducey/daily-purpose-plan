import { useMemo, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { CalendarEvent } from '@/hooks/useGoogleCalendar';
import { TimeBudgetCategory } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Plus, ChevronDown, ChevronRight, Lightbulb, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { startOfWeek, endOfWeek, differenceInMinutes } from 'date-fns';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface BudgetGapPromptProps {
  events: CalendarEvent[];
  onCreateEvent: (date?: Date, time?: string) => void;
  onCreateTask: (input: { title: string; life_area?: string; time_estimate_minutes?: number }) => Promise<any>;
}

interface AreaGap {
  category: TimeBudgetCategory;
  targetHours: number;
  actualHours: number;
  gapHours: number;
  gapPercent: number;
}

// Map category names to potential life area descriptions found in events
function matchEventToCategory(event: CalendarEvent, categories: TimeBudgetCategory[]): TimeBudgetCategory | null {
  const desc = (event.description || '').toLowerCase();
  const summary = (event.summary || '').toLowerCase();

  // Check for explicit "Life Area: X" tag in description
  const lifeAreaMatch = desc.match(/life area:\s*(.+)/i);
  if (lifeAreaMatch) {
    const areaName = lifeAreaMatch[1].trim().toLowerCase();
    const found = categories.find(c => c.name.toLowerCase() === areaName);
    if (found) return found;
  }

  // Match by colorId
  if (event.colorId) {
    const found = categories.find(c => c.googleColorId === event.colorId);
    if (found) return found;
  }

  // Keyword match on summary
  for (const cat of categories) {
    const name = cat.name.toLowerCase();
    if (summary.includes(name)) return cat;
  }

  return null;
}

const IDEA_SUGGESTIONS: Record<string, string[]> = {
  'Sleep': ['Wind-down routine', 'Set consistent bedtime', 'Digital sunset (no screens 1hr before bed)'],
  'Health': ['Morning walk', 'Gym session', 'Meal prep', 'Yoga class', 'Meditation'],
  'Work': ['Deep work block', 'Weekly planning', 'Skill development', 'Project review'],
  'Family': ['Family dinner', 'Game night', 'Park outing', 'Video call with parents'],
  'Community': ['Coffee with a friend', 'Volunteer work', 'Social event', 'Community group'],
  'Wealth': ['Budget review', 'Investment research', 'Financial planning', 'Side project'],
  'Impact': ['Mentoring session', 'Open source contribution', 'Teaching', 'Charity work'],
  'Legacy': ['Journal writing', 'Long-term planning', 'Creative project', 'Documentation'],
  'Contribution': ['Donate time', 'Help a neighbor', 'Pro bono work', 'Community cleanup'],
  'Spiritual': ['Meditation', 'Gratitude journaling', 'Nature walk', 'Reading', 'Prayer'],
  'Emotional': ['Therapy session', 'Journaling', 'Self-care time', 'Mindfulness practice'],
  'Play': ['Hobby time', 'Video games', 'Sports', 'Creative arts', 'Movie night'],
};

export function BudgetGapPrompt({ events, onCreateEvent, onCreateTask }: BudgetGapPromptProps) {
  const { categories } = useUser();
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);

  const gaps = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    // Calculate actual hours per category from events this week
    const actualMinutes: Record<string, number> = {};
    categories.forEach(c => { actualMinutes[c.id] = 0; });

    events.forEach(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      if (eventStart < weekStart || eventStart > weekEnd) return;
      if (event.allDay) return;

      const cat = matchEventToCategory(event, categories);
      if (cat) {
        actualMinutes[cat.id] = (actualMinutes[cat.id] || 0) + differenceInMinutes(eventEnd, eventStart);
      }
    });

    // Calculate how far through the week we are to pro-rate expected hours
    const weekProgress = Math.min(1, (now.getTime() - weekStart.getTime()) / (weekEnd.getTime() - weekStart.getTime()));

    const areaGaps: AreaGap[] = categories
      .filter(c => c.weeklyHoursTarget > 0 && c.name !== 'Sleep') // Skip sleep from prompts
      .map(cat => {
        const actualHours = (actualMinutes[cat.id] || 0) / 60;
        const expectedSoFar = cat.weeklyHoursTarget * weekProgress;
        const gapHours = Math.max(0, expectedSoFar - actualHours);
        const gapPercent = expectedSoFar > 0 ? (gapHours / expectedSoFar) * 100 : 0;
        return { category: cat, targetHours: cat.weeklyHoursTarget, actualHours, gapHours, gapPercent };
      })
      .filter(g => g.gapHours >= 0.5) // Only show significant gaps (30+ min behind)
      .sort((a, b) => b.gapPercent - a.gapPercent);

    return areaGaps;
  }, [events, categories]);

  const toggleArea = (id: string) => {
    setExpandedAreas(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleQuickAddTask = async (catName: string, ideaTitle: string, lifeArea: string) => {
    await onCreateTask({
      title: ideaTitle,
      life_area: lifeArea,
      time_estimate_minutes: 60,
    });
  };

  if (dismissed || gaps.length === 0) return null;

  return (
    <div className="border-t border-border">
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Budget Gaps</span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>

        <ScrollArea className="max-h-[300px]">
          <div className="space-y-1">
            <AnimatePresence>
              {gaps.map((gap) => {
                const lifeAreaKey = gap.category.name.toLowerCase();
                const ideas = IDEA_SUGGESTIONS[gap.category.name] || [];
                const isExpanded = expandedAreas.has(gap.category.id);

                return (
                  <motion.div
                    key={gap.category.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg border border-border bg-card"
                  >
                    <Collapsible open={isExpanded} onOpenChange={() => toggleArea(gap.category.id)}>
                      <CollapsibleTrigger className="flex items-center gap-2 w-full p-2.5 text-left text-sm hover:bg-muted/50 rounded-lg transition-colors">
                        {isExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                        <span className={cn("w-2 h-2 rounded-full shrink-0")} style={{ backgroundColor: `var(--${gap.category.color}, hsl(var(--muted)))` }} />
                        <span className="font-medium truncate">{gap.category.name}</span>
                        <Badge variant="outline" className="ml-auto text-[10px] h-4 shrink-0 text-amber-600 border-amber-300">
                          <Clock className="h-2.5 w-2.5 mr-0.5" />
                          {gap.gapHours.toFixed(1)}h behind
                        </Badge>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="px-3 pb-3 space-y-2">
                          <p className="text-xs text-muted-foreground">
                            {gap.actualHours.toFixed(1)}h used of {gap.targetHours}h/week target
                          </p>

                          {ideas.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Lightbulb className="h-3 w-3" />
                                <span>Ideas to schedule:</span>
                              </div>
                              {ideas.map((idea) => (
                                <div key={idea} className="flex items-center justify-between gap-2 py-1 pl-4">
                                  <span className="text-xs truncate">{idea}</span>
                                  <div className="flex gap-1 shrink-0">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 px-1.5 text-[10px]"
                                      onClick={() => handleQuickAddTask(gap.category.name, idea, lifeAreaKey)}
                                    >
                                      <Plus className="h-2.5 w-2.5 mr-0.5" />
                                      Task
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 px-1.5 text-[10px]"
                                      onClick={() => onCreateEvent()}
                                    >
                                      <Plus className="h-2.5 w-2.5 mr-0.5" />
                                      Event
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
