import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { CategorySlider } from './CategorySlider';
import { useTasks } from '@/hooks/useTasks';
import { WeekBudgetBar } from './WeekBudgetBar';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle2, Layers, Sparkles, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const TOTAL_WEEKLY_HOURS = 168;
const MAJOR_THRESHOLD = 30;

export function TimeBudgetAllocation() {
  const { categories, updateCategory, addCategory, deleteCategory, resetCategories } = useUser();
  const { createTask } = useTasks();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const totalAllocated = categories.reduce((sum, cat) => sum + cat.weeklyHoursTarget, 0);
  const remaining = TOTAL_WEEKLY_HOURS - totalAllocated;
  const isOverBudget = remaining < 0;
  const isComplete = remaining === 0;

  const majorCategories = [...categories]
    .filter(c => c.weeklyHoursTarget >= MAJOR_THRESHOLD)
    .sort((a, b) => b.weeklyHoursTarget - a.weeklyHoursTarget);
  
  const minorCategories = [...categories]
    .filter(c => c.weeklyHoursTarget < MAJOR_THRESHOLD)
    .sort((a, b) => b.weeklyHoursTarget - a.weeklyHoursTarget);

  const majorTotal = majorCategories.reduce((sum, cat) => sum + cat.weeklyHoursTarget, 0);
  const remainingAfterMajor = TOTAL_WEEKLY_HOURS - majorTotal;

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Status badge */}
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

      {/* Full week segmented bar */}
      <motion.div
        className="p-5 rounded-xl bg-card shadow-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <WeekBudgetBar categories={categories} />
      </motion.div>

      {/* Major commitments (≥30h) */}
      {majorCategories.length > 0 && (
        <motion.section
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Major Commitments
            </h2>
            <span className="text-xs text-muted-foreground ml-auto">
              {majorTotal}h / {TOTAL_WEEKLY_HOURS}h
            </span>
          </div>
          <div className="grid gap-5 p-5 rounded-xl bg-card shadow-card">
            {majorCategories.map((category, index) => (
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
                  onDelete={() => deleteCategory(category.id)}
                  onAddTask={createTask}
                  maxTotal={TOTAL_WEEKLY_HOURS}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Minor categories (<30h) */}
      {minorCategories.length > 0 && (
        <motion.section
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Life Enrichment
            </h2>
            <span className="text-xs text-muted-foreground ml-auto">
              {remainingAfterMajor}h available
            </span>
          </div>
          <div className="grid gap-5 p-5 rounded-xl bg-card shadow-card">
            {minorCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.04, duration: 0.3 }}
              >
                <CategorySlider
                  category={category}
                  onValueChange={(value) => updateCategory(category.id, { weeklyHoursTarget: value })}
                  onColorChange={(colorId) => updateCategory(category.id, { googleColorId: colorId })}
                  onDelete={() => deleteCategory(category.id)}
                  maxTotal={Math.max(remainingAfterMajor, category.weeklyHoursTarget)}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Add category */}
      <motion.div
        className="p-5 rounded-xl bg-card shadow-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {showAddForm ? (
          <div className="flex gap-2">
            <Input
              placeholder="Category name (e.g. Volunteering)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              autoFocus
            />
            <Button size="sm" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowAddForm(false); setNewCategoryName(''); }}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Life Area
            </Button>
            <Button variant="ghost" size="sm" onClick={resetCategories} title="Reset to default categories">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
