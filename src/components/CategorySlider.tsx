import { Slider } from '@/components/ui/slider';
import { TimeBudgetCategory } from '@/types/user';
import { 
  Moon, Heart, Briefcase, Users, Globe, TrendingUp, 
  Target, Award, Gift, Sun, Smile, Gamepad2,
  LucideIcon
} from 'lucide-react';

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
  totalAllocated: number;
  maxTotal?: number;
}

export function CategorySlider({ 
  category, 
  onValueChange, 
  totalAllocated,
  maxTotal = 168 
}: CategorySliderProps) {
  const Icon = iconMap[category.icon] || Target;
  const percentage = ((category.weeklyHoursTarget / maxTotal) * 100).toFixed(1);
  const remaining = maxTotal - totalAllocated + category.weeklyHoursTarget;
  
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
        <div className="text-right">
          <span className="font-sans font-semibold text-sm">
            {category.weeklyHoursTarget}h
          </span>
          <span className="text-xs text-muted-foreground ml-1">
            ({percentage}%)
          </span>
        </div>
      </div>
      
      <Slider
        value={[category.weeklyHoursTarget]}
        max={Math.min(remaining, maxTotal)}
        min={0}
        step={1}
        onValueChange={(values) => onValueChange(values[0])}
        className="cursor-pointer"
      />
    </div>
  );
}
