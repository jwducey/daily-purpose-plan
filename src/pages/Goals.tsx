import { useState, useRef, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { useUser, LifeGoal } from '@/contexts/UserContext';
import { LifeAreaGoals } from '@/components/LifeAreaGoals';
import { GoalTaskItem } from '@/components/GoalTaskItem';
import { useTasks } from '@/hooks/useTasks';
import { GOOGLE_CALENDAR_COLORS } from '@/types/user';
import { motion } from 'framer-motion';
import { Target, Moon, Heart, Briefcase, Users, Globe, TrendingUp, Award, Gift, Sun, Smile, Gamepad2, LucideIcon, GripVertical } from 'lucide-react';
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

function useDragReorder<T extends { id: string }>(items: T[], onReorder: (ids: string[]) => void) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((id: string) => {
    setDragId(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverId(id);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!dragId || !overId || dragId === overId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const ids = items.map(i => i.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(overId);
    if (fromIdx === -1 || toIdx === -1) return;
    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, dragId);
    onReorder(ids);
    setDragId(null);
    setOverId(null);
  }, [dragId, overId, items, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setOverId(null);
  }, []);

  return { dragId, overId, handleDragStart, handleDragOver, handleDrop, handleDragEnd };
}

export default function Goals() {
  const { categories, goals, reorderCategories, reorderGoals } = useUser();
  const { tasks, createTask, updateTask } = useTasks();

  const handleToggleTask = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed });
  };

  const catDrag = useDragReorder(categories, reorderCategories);

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
            <h1 className="text-2xl md:text-3xl font-serif">Goals</h1>
            <p className="text-muted-foreground text-sm">
              Define goals for each life area and break them into actionable tasks. Drag to reorder by priority.
            </p>
          </motion.header>

          <div className="space-y-4">
            {categories.map((category, i) => {
              const Icon = iconMap[category.icon] || Target;
              const calColor = GOOGLE_CALENDAR_COLORS[category.googleColorId] || GOOGLE_CALENDAR_COLORS['1'];
              const categoryGoals = goals.filter(g => g.categoryId === category.id);

              return (
                <div
                  key={category.id}
                  draggable
                  onDragStart={() => catDrag.handleDragStart(category.id)}
                  onDragOver={(e) => catDrag.handleDragOver(e, category.id)}
                  onDrop={catDrag.handleDrop}
                  onDragEnd={catDrag.handleDragEnd}
                  className={cn(
                    "rounded-xl border border-border bg-card p-5 shadow-sm transition-all cursor-grab active:cursor-grabbing",
                    catDrag.dragId === category.id && "opacity-40",
                    catDrag.overId === category.id && catDrag.dragId !== category.id && "border-primary ring-2 ring-primary/20"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
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

                  <LifeAreaGoals categoryId={category.id} />

                  {categoryGoals.length > 0 && (
                    <GoalTasksSection
                      categoryGoals={categoryGoals}
                      calColor={calColor}
                      categoryName={category.name}
                      tasks={tasks}
                      createTask={createTask}
                      onToggleTask={handleToggleTask}
                      onReorderGoals={reorderGoals}
                      allGoals={goals}
                    />
                  )}
                </div>
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

interface GoalTasksSectionProps {
  categoryGoals: LifeGoal[];
  calColor: { name: string; hex: string };
  categoryName: string;
  tasks: any[];
  createTask: any;
  onToggleTask: (taskId: string, completed: boolean) => void;
  onReorderGoals: (orderedIds: string[]) => void;
  allGoals: LifeGoal[];
}

function GoalTasksSection({ categoryGoals, calColor, categoryName, tasks, createTask, onToggleTask, onReorderGoals, allGoals }: GoalTasksSectionProps) {
  const goalDrag = useDragReorder(categoryGoals, (newCategoryGoalIds) => {
    // Merge back: keep other category goals in place, replace this category's goals in order
    const otherGoals = allGoals.filter(g => !categoryGoals.some(cg => cg.id === g.id));
    // Insert reordered category goals at the position of the first original one
    const firstIdx = allGoals.findIndex(g => categoryGoals.some(cg => cg.id === g.id));
    const allIds = allGoals.map(g => g.id);
    // Remove all category goal ids
    const filtered = allIds.filter(id => !categoryGoals.some(cg => cg.id === id));
    // Insert at firstIdx position
    filtered.splice(Math.min(firstIdx, filtered.length), 0, ...newCategoryGoalIds);
    onReorderGoals(filtered);
  });

  return (
    <div className="mt-4 space-y-2 border-t border-border/50 pt-3">
      <p className="text-xs font-medium text-muted-foreground">Tasks by Goal</p>
      {categoryGoals.map(goal => (
        <div
          key={goal.id}
          draggable
          onDragStart={(e) => { e.stopPropagation(); goalDrag.handleDragStart(goal.id); }}
          onDragOver={(e) => { e.stopPropagation(); goalDrag.handleDragOver(e, goal.id); }}
          onDrop={(e) => { e.stopPropagation(); goalDrag.handleDrop(e); }}
          onDragEnd={goalDrag.handleDragEnd}
          className={cn(
            "pl-2 border-l-2 transition-all cursor-grab active:cursor-grabbing",
            goalDrag.dragId === goal.id && "opacity-40",
            goalDrag.overId === goal.id && goalDrag.dragId !== goal.id && "bg-primary/5 rounded-r-md"
          )}
          style={{ borderColor: calColor.hex }}
        >
          <div className="flex items-center gap-1.5">
            <GripVertical className="w-3 h-3 text-muted-foreground/40 shrink-0" />
            <p className="text-xs font-medium">{goal.text}</p>
          </div>
          <GoalTaskItem
            tasks={tasks}
            goalId={goal.id}
            goalText={goal.text}
            lifeAreaName={categoryName}
            onCreateTask={createTask}
            onToggleTask={onToggleTask}
          />
        </div>
      ))}
    </div>
  );
}
