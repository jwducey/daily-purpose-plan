import { useState } from 'react';
import { useUser, LifeGoal } from '@/contexts/UserContext';
import { Pencil, Plus, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GoalItemProps {
  goal: LifeGoal;
  onUpdate: (id: string, text: string) => void;
  onRemove: (id: string) => void;
}

function GoalItem({ goal, onUpdate, onRemove }: GoalItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal.text);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      onUpdate(goal.id, trimmed);
      setEditing(false);
    }
  };

  const cancel = () => {
    setDraft(goal.text);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') cancel();
          }}
          className="h-7 text-xs flex-1"
          autoFocus
        />
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={save}>
          <Check className="h-3 w-3 text-green-600" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 group/goal text-xs py-1 px-2 rounded bg-muted/50">
      <span className="flex-1 truncate">{goal.text}</span>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover/goal:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
      >
        <Pencil className="h-3 w-3" />
      </button>
      <button
        onClick={() => onRemove(goal.id)}
        className="opacity-0 group-hover/goal:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

interface LifeAreaGoalsProps {
  categoryId: string;
}

export function LifeAreaGoals({ categoryId }: LifeAreaGoalsProps) {
  const { goals, addGoal, updateGoal, removeGoal } = useUser();
  const [adding, setAdding] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');

  const categoryGoals = goals.filter((g) => g.categoryId === categoryId);

  const handleAdd = () => {
    const trimmed = newGoalText.trim();
    if (trimmed) {
      addGoal(categoryId, trimmed);
      setNewGoalText('');
      setAdding(false);
    }
  };

  return (
    <div className="mt-2 space-y-1.5 pl-2">
      {categoryGoals.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground italic">No goals yet</p>
      )}
      {categoryGoals.map((goal) => (
        <GoalItem key={goal.id} goal={goal} onUpdate={updateGoal} onRemove={removeGoal} />
      ))}
      {adding ? (
        <div className="flex items-center gap-1.5">
          <Input
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setAdding(false); setNewGoalText(''); }
            }}
            placeholder="I will WHAT by WHEN"
            className="h-7 text-xs flex-1"
            autoFocus
          />
          <Button size="sm" variant="outline" className="h-7 px-2 shrink-0" onClick={handleAdd} disabled={!newGoalText.trim()}>
            <Plus className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 shrink-0" onClick={() => { setAdding(false); setNewGoalText(''); }}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" />
          <span>Add goal</span>
        </button>
      )}
    </div>
  );
}
