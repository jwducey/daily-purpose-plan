import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { TimeBudgetCategory, GOOGLE_CALENDAR_COLORS } from '@/types/user';
import { Input } from '@/components/ui/input';
import { 
  Moon, Heart, Briefcase, Users, Globe, TrendingUp, 
  Target, Award, Gift, Sun, Smile, Gamepad2,
  LucideIcon, Palette, ChevronDown, ChevronRight, Plus, X, Lightbulb
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';

const iconMap: Record<string, LucideIcon> = {
  'moon': Moon,
  'heart': Heart,
  'briefcase': Briefcase,
  'users': Users,
  'globe': Globe,
  'trending-up': TrendingUp,
  'target': Target,
  'award': Award,
  'gift': Gift,
  'sun': Sun,
  'smile': Smile,
  'gamepad-2': Gamepad2,
};

interface CategorySliderProps {
  category: TimeBudgetCategory;
  onValueChange: (value: number) => void;
  onColorChange: (colorId: string) => void;
  maxTotal?: number;
}

export function CategorySlider({ 
  category, 
  onValueChange, 
  onColorChange,
  maxTotal = 168 
}: CategorySliderProps) {
  const Icon = iconMap[category.icon] || Target;
  const percentage = ((category.weeklyHoursTarget / maxTotal) * 100).toFixed(1);
  const selectedColor = GOOGLE_CALENDAR_COLORS[category.googleColorId] || GOOGLE_CALENDAR_COLORS['1'];
  const { customSuggestions, addCustomSuggestion, removeCustomSuggestion } = useUser();
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [newIdea, setNewIdea] = useState('');

  const ideas = customSuggestions[category.name] || [];

  const handleAddIdea = () => {
    const trimmed = newIdea.trim();
    if (trimmed && !ideas.includes(trimmed)) {
      addCustomSuggestion(category.name, trimmed);
      setNewIdea('');
    }
  };

  return (
    <div className={`slider-${category.color} group`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-category-${category.color}/10`}>
            <Icon className={`w-4 h-4 text-category-${category.color}`} />
          </div>
          <div>
            <span className="font-medium text-sm">{category.name}</span>
            <p className="text-xs text-muted-foreground hidden group-hover:block">
              {category.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted">
                <div 
                  className="w-4 h-4 rounded-full border border-border shadow-sm"
                  style={{ backgroundColor: selectedColor.hex }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="end">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  Calendar Color
                </p>
                <div className="grid grid-cols-6 gap-1.5">
                  {Object.entries(GOOGLE_CALENDAR_COLORS).map(([id, { name, hex }]) => (
                    <button
                      key={id}
                      onClick={() => onColorChange(id)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                        category.googleColorId === id 
                          ? "border-foreground ring-2 ring-foreground/20" 
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: hex }}
                      title={name}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground text-center pt-1">
                  {selectedColor.name}
                </p>
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="text-right">
            <span className="font-sans font-semibold text-sm">
              {category.weeklyHoursTarget}h
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              ({percentage}%)
            </span>
          </div>
        </div>
      </div>
      
      <Slider
        value={[category.weeklyHoursTarget]}
        max={maxTotal}
        min={0}
        step={1}
        onValueChange={(values) => onValueChange(values[0])}
        trackColor={selectedColor.hex}
        className="cursor-pointer"
      />

      {/* Custom ideas dropdown */}
      <Collapsible open={ideasOpen} onOpenChange={setIdeasOpen}>
        <CollapsibleTrigger className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          {ideasOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Lightbulb className="h-3 w-3" />
          <span>Ideas ({ideas.length})</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-1.5 pl-2">
            {ideas.map((idea) => (
              <div key={idea} className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded bg-muted/50">
                <span className="truncate">{idea}</span>
                <button
                  onClick={() => removeCustomSuggestion(category.name, idea)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <div className="flex gap-1.5">
              <Input
                value={newIdea}
                onChange={(e) => setNewIdea(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddIdea()}
                placeholder="Add an idea..."
                className="h-7 text-xs"
              />
              <Button size="sm" variant="outline" className="h-7 px-2 shrink-0" onClick={handleAddIdea} disabled={!newIdea.trim()}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
