import { Navigation } from '@/components/Navigation';
import { useUser } from '@/contexts/UserContext';
import { LifeAreaGoals } from '@/components/LifeAreaGoals';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

export default function Goals() {
  const { categories } = useUser();

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
              Define goals for each life area. Use the format: I will [WHAT] by [WHEN].
            </p>
          </motion.header>

          <div className="space-y-6">
            {categories
              .sort((a, b) => b.weeklyHoursTarget - a.weeklyHoursTarget)
              .map((category, i) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <h2 className="text-base font-semibold">{category.name}</h2>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {category.weeklyHoursTarget}h / week
                    </span>
                  </div>
                  <LifeAreaGoals categoryId={category.id} />
                </motion.div>
              ))}

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
