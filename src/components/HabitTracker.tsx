import { useState } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Flame, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const EMOJI_OPTIONS = ['✅', '💪', '📚', '🧘', '💧', '🏃', '🎯', '💤', '🥗', '✍️', '🎵', '🧠'];
const COLOR_OPTIONS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
];

const DAYS_TO_SHOW = 7;

export function HabitTracker() {
  const { habits, loading, addHabit, deleteHabit, toggleCompletion, getStreak, isCompletedOn } = useHabits();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('✅');
  const [newColor, setNewColor] = useState('#3b82f6');

  const today = new Date();
  const days = Array.from({ length: DAYS_TO_SHOW }, (_, i) => subDays(today, DAYS_TO_SHOW - 1 - i));

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addHabit(newName.trim(), newIcon, newColor);
    setNewName('');
    setNewIcon('✅');
    setNewColor('#3b82f6');
    setShowAdd(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Loading habits...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-foreground">Daily Habits</h2>
          <p className="text-sm text-muted-foreground">Track your consistency, build your streaks</p>
        </div>
        <Button
          onClick={() => setShowAdd(!showAdd)}
          size="sm"
          variant={showAdd ? 'outline' : 'default'}
          className="gap-1.5"
        >
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? 'Cancel' : 'New Habit'}
        </Button>
      </div>

      {/* Add Habit Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-4 space-y-3 border-dashed border-2 border-primary/30 bg-primary/5">
              <Input
                placeholder="Habit name (e.g. Meditate 10 min)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Icon</span>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(e => (
                    <button
                      key={e}
                      onClick={() => setNewIcon(e)}
                      className={cn(
                        'w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all',
                        newIcon === e ? 'bg-primary/20 ring-2 ring-primary scale-110' : 'bg-muted hover:bg-muted/80'
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Color</span>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={cn(
                        'w-7 h-7 rounded-full transition-all',
                        newColor === c ? 'ring-2 ring-offset-2 ring-foreground scale-110' : ''
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full" disabled={!newName.trim()}>
                Add Habit
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Day headers */}
      {habits.length > 0 && (
        <div className="grid gap-1.5 sm:gap-3" style={{ gridTemplateColumns: `minmax(0, 1fr) repeat(${DAYS_TO_SHOW}, minmax(32px, 44px)) minmax(40px, 60px)` }}>
          <div />
          {days.map(day => (
            <div key={day.toISOString()} className="text-center">
              <div className="text-[10px] font-medium text-muted-foreground uppercase">
                {format(day, 'EEE')[0]}<span className="hidden sm:inline">{format(day, 'EEE').slice(1)}</span>
              </div>
              <div className={cn(
                'text-xs font-semibold',
                format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd') ? 'text-primary' : 'text-foreground'
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
          <div className="text-center text-[10px] font-medium text-muted-foreground">
            <span className="hidden sm:inline">STREAK</span>
            <span className="sm:hidden">🔥</span>
          </div>
        </div>
      )}

      {/* Habit rows */}
      <div className="space-y-2">
        <AnimatePresence>
          {habits.map((habit, index) => {
            const streak = getStreak(habit.id);
            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-2 sm:p-3 hover:shadow-md transition-shadow group">
                  <div
                    className="grid gap-1.5 sm:gap-3 items-center"
                    style={{ gridTemplateColumns: `minmax(0, 1fr) repeat(${DAYS_TO_SHOW}, minmax(32px, 44px)) minmax(40px, 60px)` }}
                  >
                    {/* Habit info */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl flex-shrink-0">{habit.icon}</span>
                      <span className="text-sm font-medium truncate text-foreground">{habit.name}</span>
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>

                    {/* Day checkboxes */}
                    {days.map(day => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const completed = isCompletedOn(habit.id, dateStr);
                      return (
                        <div key={dateStr} className="flex justify-center">
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => toggleCompletion(habit.id, dateStr)}
                            className={cn(
                              'w-9 h-9 rounded-xl flex items-center justify-center transition-all text-sm font-bold',
                              completed
                                ? 'text-white shadow-md'
                                : 'bg-muted/50 hover:bg-muted text-muted-foreground/30 border border-border'
                            )}
                            style={completed ? {
                              backgroundColor: habit.color,
                              boxShadow: `0 2px 8px ${habit.color}40`,
                            } : undefined}
                          >
                            {completed ? '✓' : ''}
                          </motion.button>
                        </div>
                      );
                    })}

                    {/* Streak */}
                    <div className="flex items-center justify-center">
                      {streak > 0 ? (
                        <motion.div
                          key={streak}
                          initial={{ scale: 0.5 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1 px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: `${habit.color}15`,
                            color: habit.color,
                          }}
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">{streak}</span>
                        </motion.div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {habits.length === 0 && !showAdd && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="text-5xl mb-4">🔥</div>
          <h3 className="text-lg font-serif text-foreground mb-2">Start Building Habits</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            Add your first daily habit and watch your streak grow day by day.
          </p>
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Your First Habit
          </Button>
        </motion.div>
      )}
    </div>
  );
}
