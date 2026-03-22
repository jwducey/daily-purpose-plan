import { Navigation } from '@/components/Navigation';
import { useUser, LifeGoal } from '@/contexts/UserContext';
import { LifeAreaGoals } from '@/components/LifeAreaGoals';
import { GoalTaskItem } from '@/components/GoalTaskItem';
import { useTasks } from '@/hooks/useTasks';
import { GOOGLE_CALENDAR_COLORS } from '@/types/user';
import { motion } from 'framer-motion';
import { Target, Moon, Heart, Briefcase, Users, Globe, TrendingUp, Award, Gift, Sun, Smile, Gamepad2, LucideIcon } from 'lucide-react';

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

export default function Goals() {
  const { categories, goals } = useUser();
  const { tasks, createTask, updateTask } = useTasks();

  const handleToggleTask = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed, ...(completed ? {} : {}) });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Navigation />

      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-8">
          <motion.header
            className="space-y-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl md:text-3xl font-serif">Life Goals</h1>
            <p className="text-muted-foreground text-sm">
              Define goals for each life area and break them into actionable tasks.
            </p>
          </motion.header>

          <div className="space-y-6">
            {categories
              .sort((a, b) => b.weeklyHoursTarget - a.weeklyHoursTarget)
              .map((category, i) => {
                const Icon = iconMap[category.icon] || Target;
                const calColor = GOOGLE_CALENDAR_COLORS[category.googleColorId] || GOOGLE_CALENDAR_COLORS['1'];
                const categoryGoals = goals.filter(g => g.categoryId === category.id);

                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-xl border border-border bg-card p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${calColor.hex}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: calColor.hex }} />
                      </div>
                      <h2 className="text-base font-semibold">{category.name}</h2>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {category.weeklyHoursTarget}h / week
                      </span>
                    </div>

                    {/* Goals list with inline add */}
                    <LifeAreaGoals categoryId={category.id} />

                    {/* Tasks per goal */}
                    {categoryGoals.length > 0 && (
                      <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
                        <p className="text-xs font-medium text-muted-foreground">Tasks by Goal</p>
                        {categoryGoals.map(goal => (
                          <div key={goal.id} className="pl-2 border-l-2" style={{ borderColor: calColor.hex }}>
                            <p className="text-xs font-medium">{goal.text}</p>
                            <GoalTaskItem
                              tasks={tasks}
                              goalId={goal.id}
                              goalText={goal.text}
                              lifeAreaName={category.name}
                              onCreateTask={createTask}
                              onToggleTask={handleToggleTask}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}

            {categories.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Set up your life areas on the Budget tab first.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
