import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/contexts/UserContext';
import { MortalityCountdown } from '@/components/MortalityCountdown';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Navigation } from '@/components/Navigation';
import { motion } from 'framer-motion';
import { PieChart, ArrowRight, Target, Heart, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CoreValuesAssessment } from '@/components/CoreValuesAssessment';
import { useCoreValuesColors } from '@/hooks/useCoreValuesColors';

const VALUE_COLOR_PRESETS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  '#64748b', '#78716c',
];

export default function Dashboard() {
  const { user, categories, goals } = useUser();
  const [coreValues, setCoreValues] = useState<string[]>([]);
  const [valuesStatements, setValuesStatements] = useState<Record<string, string>>({});
  const { valuesColors, updateColor: updateValueColor } = useCoreValuesColors(user?.id);
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadValues = async () => {
      if (user) {
        const { data } = await supabase
          .from('core_values_shortlist')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) {
          if (data.selected_values?.length) setCoreValues(data.selected_values);
          if ((data as any).values_statements) setValuesStatements((data as any).values_statements as Record<string, string>);
          return;
        }
      }
      const local = localStorage.getItem('core-values-shortlist');
      const localStatements = localStorage.getItem('core-values-statements');
      if (local) setCoreValues(JSON.parse(local));
      if (localStatements) setValuesStatements(JSON.parse(localStatements));
    };
    loadValues();
  }, [user]);

  // Close color picker on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerOpen(null);
      }
    };
    if (colorPickerOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [colorPickerOpen]);

  const handleUpdateValueColor = (value: string, color: string) => {
    updateValueColor(value, color);
    setColorPickerOpen(null);
  };

  if (!user) return null;

  const totalAllocated = categories.reduce((sum, cat) => sum + cat.weeklyHoursTarget, 0);
  const topCategories = [...categories]
    .sort((a, b) => b.weeklyHoursTarget - a.weeklyHoursTarget)
    .slice(0, 3);

  const categoriesWithGoals = categories.filter(cat => goals.some(g => g.categoryId === cat.id));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Navigation />
      
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-10">
          <DashboardHeader />
          
          {/* Mortality Countdown - Hero section */}
          <motion.section 
            className="p-8 md:p-12 rounded-3xl bg-card shadow-soft"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <MortalityCountdown 
              birthDate={user.birthDate} 
              expectedLifespan={user.expectedLifespan} 
            />
          </motion.section>

          {/* Quick stats */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Time budget overview */}
            <motion.div 
              className="p-6 rounded-2xl bg-card shadow-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-life-energy/10">
                    <PieChart className="w-5 h-5 text-life-energy" />
                  </div>
                  <h3 className="font-serif text-lg">Weekly Budget</h3>
                </div>
                <Link 
                  to="/budget" 
                  className="text-sm text-muted-foreground hover:text-life-energy transition-colors flex items-center gap-1"
                >
                  Edit <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="space-y-3">
                {topCategories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{cat.name}</span>
                    <span className="font-sans font-medium">{cat.weeklyHoursTarget}h</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm font-medium">Total Allocated</span>
                <span className="font-sans font-semibold text-life-energy">
                  {totalAllocated}/168h
                </span>
              </div>
            </motion.div>

            {/* Weekly insight */}
            <motion.div 
              className="p-6 rounded-2xl bg-gradient-to-br from-life-energy/10 to-life-energy/5 border border-life-energy/10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <h3 className="font-serif text-lg mb-3">Weekly Insight</h3>
              {(() => {
                const TOTAL_WEEKLY_HOURS = 168;
                const awakeCats = categories.filter(c => c.name.toLowerCase() !== 'sleep');
                const sleepCat = categories.find(c => c.name.toLowerCase() === 'sleep');
                const sleepHours = sleepCat?.weeklyHoursTarget ?? 0;
                const awakeHours = TOTAL_WEEKLY_HOURS - sleepHours;
                const awakeAllocated = awakeCats.reduce((s, c) => s + c.weeklyHoursTarget, 0);
                const unallocated = awakeHours - awakeAllocated;
                const topAwake = [...awakeCats].sort((a, b) => b.weeklyHoursTarget - a.weeklyHoursTarget);
                const zeroCategories = awakeCats.filter(c => c.weeklyHoursTarget === 0);
                const lowCategories = awakeCats.filter(c => c.weeklyHoursTarget > 0 && c.weeklyHoursTarget <= 3);

                return (
                  <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                    <p>
                      Of your <span className="font-medium text-foreground">{awakeHours}h</span> awake hours, 
                      you've allocated <span className="font-medium text-foreground">{awakeAllocated}h</span>.
                      {unallocated > 0 && (
                        <span className="text-life-energy font-medium"> {unallocated}h unaccounted for.</span>
                      )}
                    </p>

                    {topAwake[0] && (
                      <p>
                        Your biggest investment: <span className="font-medium text-foreground">{topAwake[0].name}</span> at {topAwake[0].weeklyHoursTarget}h
                        {topAwake[1] && <>, followed by <span className="font-medium text-foreground">{topAwake[1].name}</span> at {topAwake[1].weeklyHoursTarget}h</>}.
                      </p>
                    )}

                    {zeroCategories.length > 0 && (
                      <p className="text-destructive/80">
                        ⚠ No time allocated to: {zeroCategories.map(c => c.name).join(', ')}.
                      </p>
                    )}

                    {lowCategories.length > 0 && (
                      <p>
                        Low investment ({'\u2264'}3h): {lowCategories.map(c => `${c.name} (${c.weeklyHoursTarget}h)`).join(', ')}.
                      </p>
                    )}
                  </div>
                );
              })()}
              <Link 
                to="/review" 
                className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-life-energy hover:underline"
              >
                Start Weekly Review <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          {/* Life Goals Widget */}
          {(categoriesWithGoals.length > 0 || goals.length === 0) && (
            <motion.section
              className="p-6 rounded-2xl bg-card shadow-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-life-energy/10">
                    <Target className="w-5 h-5 text-life-energy" />
                  </div>
                  <h3 className="font-serif text-lg">Life Goals</h3>
                </div>
                <Link 
                  to="/budget" 
                  className="text-sm text-muted-foreground hover:text-life-energy transition-colors flex items-center gap-1"
                >
                  Manage <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {goals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No goals set yet. Head to the <Link to="/budget" className="text-life-energy hover:underline">Budget tab</Link> to add goals for each life area.
                </p>
              ) : (
                <div className="space-y-5">
                  {categoriesWithGoals.map((cat) => {
                    const catGoals = goals.filter(g => g.categoryId === cat.id);
                    return (
                      <div key={cat.id}>
                        <h4 className="text-base font-semibold mb-2">{cat.name}</h4>
                        <ul className="space-y-2 pl-1">
                          {catGoals.map((goal) => (
                            <li key={goal.id} className="text-base text-foreground/80 flex items-start gap-2">
                              <span className="mt-2 h-2 w-2 rounded-full bg-life-energy shrink-0" />
                              {goal.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.section>
          )}

          {/* Core Values Widget */}
          {coreValues.length > 0 && (
            <motion.section
              className="p-6 rounded-2xl bg-card shadow-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-life-energy/10">
                    <Heart className="w-5 h-5 text-life-energy" />
                  </div>
                  <h3 className="font-serif text-lg">Core Values</h3>
                </div>
                <Link 
                  to="/values" 
                  className="text-sm text-muted-foreground hover:text-life-energy transition-colors flex items-center gap-1"
                >
                  Edit <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {coreValues.map((value, idx) => {
                  const valueColor = valuesColors[value];
                  return (
                    <div key={value} className="flex items-center gap-3 group">
                      <span className="text-xs font-bold text-muted-foreground/50 w-5 text-right shrink-0">#{idx + 1}</span>
                      <div className="relative shrink-0">
                        <button
                          onClick={() => setColorPickerOpen(colorPickerOpen === value ? null : value)}
                          className="h-4 w-4 rounded-full border border-border/50 hover:scale-125 transition-transform cursor-pointer flex items-center justify-center"
                          style={{ backgroundColor: valueColor || 'hsl(var(--life-energy))' }}
                          title="Change color"
                        >
                          <Palette className="w-2.5 h-2.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                        {colorPickerOpen === value && (
                          <div ref={colorPickerRef} className="absolute left-6 top-0 z-50 bg-popover border border-border rounded-lg p-2 shadow-lg">
                            <div className="grid grid-cols-6 gap-1.5 w-fit">
                              {VALUE_COLOR_PRESETS.map((color) => (
                                <button
                                  key={color}
                                  onClick={() => handleUpdateValueColor(value, color)}
                                  className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110"
                                  style={{
                                    backgroundColor: color,
                                    borderColor: valuesColors[value] === color ? 'hsl(var(--foreground))' : 'transparent',
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-base font-semibold" style={{ color: valueColor || 'hsl(var(--foreground))' }}>{value}</span>
                        {valuesStatements[value] && (
                          <p className="text-sm mt-1 italic leading-relaxed" style={{ color: valueColor ? `${valueColor}cc` : 'hsl(var(--muted-foreground))' }}>
                            "{valuesStatements[value]}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Monthly Assessment Widget */}
              <CoreValuesAssessment />
            </motion.section>
          )}
        </div>
      </main>
    </div>
  );
}
