import { useUser } from '@/contexts/UserContext';
import { CategorySlider } from './CategorySlider';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

const TOTAL_WEEKLY_HOURS = 168; // 24 * 7

export function TimeBudgetAllocation() {
  const { categories, updateCategory } = useUser();

  const totalAllocated = categories.reduce((sum, cat) => sum + cat.weeklyHoursTarget, 0);
  const remaining = TOTAL_WEEKLY_HOURS - totalAllocated;
  const isOverBudget = remaining < 0;
  const isComplete = remaining === 0;

  // Sort categories by hours allocated (highest first)
  const sortedCategories = [...categories].sort((a, b) => b.weeklyHoursTarget - a.weeklyHoursTarget);

  return (
    <div className="space-y-6">
      {/* Header with total */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-card shadow-card">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Weekly Time Budget</p>
            <p className="text-xs text-muted-foreground">168 hours per week</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
          isOverBudget 
            ? 'bg-destructive/10 text-destructive' 
            : isComplete 
              ? 'bg-growth/10 text-growth' 
              : 'bg-muted text-muted-foreground'
        }`}>
          {isOverBudget ? (
            <AlertCircle className="w-4 h-4" />
          ) : isComplete ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : null}
          <span className="font-sans font-semibold text-sm">
            {isOverBudget ? `${Math.abs(remaining)}h over` : isComplete ? 'Balanced' : `${remaining}h remaining`}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <motion.div 
          className={`h-full ${isOverBudget ? 'bg-destructive' : 'bg-life-energy'}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((totalAllocated / TOTAL_WEEKLY_HOURS) * 100, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Category sliders */}
      <div className="grid gap-6">
        {sortedCategories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <CategorySlider
              category={category}
              onValueChange={(value) => updateCategory(category.id, { weeklyHoursTarget: value })}
              onColorChange={(colorId) => updateCategory(category.id, { googleColorId: colorId })}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
