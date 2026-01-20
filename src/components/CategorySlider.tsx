import { Slider } from '@/components/ui/slider';
import { TimeBudgetCategory, GOOGLE_CALENDAR_COLORS } from '@/types/user';
import { 
  Moon, Heart, Briefcase, Users, Globe, TrendingUp, 
  Target, Award, Gift, Sun, Smile, Gamepad2,
  LucideIcon, Palette
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
          {/* Color picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-muted"
              >
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
    </div>
  );
}
