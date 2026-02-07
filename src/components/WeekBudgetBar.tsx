import { TimeBudgetCategory, GOOGLE_CALENDAR_COLORS } from '@/types/user';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const TOTAL_WEEKLY_HOURS = 168;

interface WeekBudgetBarProps {
  categories: TimeBudgetCategory[];
}

export function WeekBudgetBar({ categories }: WeekBudgetBarProps) {
  const totalAllocated = categories.reduce((sum, cat) => sum + cat.weeklyHoursTarget, 0);
  const unallocated = Math.max(0, TOTAL_WEEKLY_HOURS - totalAllocated);
  
  // Sort by hours descending for visual consistency
  const sorted = [...categories]
    .filter(c => c.weeklyHoursTarget > 0)
    .sort((a, b) => b.weeklyHoursTarget - a.weeklyHoursTarget);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Your Week at a Glance
        </p>
        <p className="text-xs text-muted-foreground">
          {totalAllocated}h allocated / {TOTAL_WEEKLY_HOURS}h
        </p>
      </div>
      
      <TooltipProvider delayDuration={0}>
        <div className="flex h-10 rounded-xl overflow-hidden shadow-card border border-border/50">
          {sorted.map((cat, i) => {
            const widthPct = (cat.weeklyHoursTarget / TOTAL_WEEKLY_HOURS) * 100;
            const color = GOOGLE_CALENDAR_COLORS[cat.googleColorId] || GOOGLE_CALENDAR_COLORS['1'];
            
            return (
              <Tooltip key={cat.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    className="relative flex items-center justify-center cursor-default overflow-hidden"
                    style={{ 
                      backgroundColor: color.hex,
                      width: `${widthPct}%`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.5, delay: i * 0.03, ease: 'easeOut' }}
                  >
                    {widthPct > 6 && (
                      <span className="text-[10px] font-semibold text-white drop-shadow-sm truncate px-1">
                        {cat.weeklyHoursTarget}h
                      </span>
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <span className="font-semibold">{cat.name}</span> — {cat.weeklyHoursTarget}h/week ({((cat.weeklyHoursTarget / TOTAL_WEEKLY_HOURS) * 100).toFixed(0)}%)
                </TooltipContent>
              </Tooltip>
            );
          })}
          
          {unallocated > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className="flex items-center justify-center bg-muted/60"
                  style={{ width: `${(unallocated / TOTAL_WEEKLY_HOURS) * 100}%` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {(unallocated / TOTAL_WEEKLY_HOURS) * 100 > 6 && (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {unallocated}h
                    </span>
                  )}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <span className="font-semibold">Unallocated</span> — {unallocated}h
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {sorted.map(cat => {
          const color = GOOGLE_CALENDAR_COLORS[cat.googleColorId] || GOOGLE_CALENDAR_COLORS['1'];
          return (
            <div key={cat.id} className="flex items-center gap-1.5">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: color.hex }} 
              />
              <span className="text-[10px] text-muted-foreground">{cat.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
