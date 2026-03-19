import { useMemo, useState, useCallback } from 'react';
import { Task, CreateTaskInput, UpdateTaskInput } from '@/hooks/useTasks';
import { useUser } from '@/contexts/UserContext';
import { DraggableTaskBlock } from './DraggableTaskBlock';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Sparkles, ChevronDown, ChevronRight, AlertTriangle, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GOOGLE_CALENDAR_COLORS } from '@/types/user';
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface TaskPoolSidebarProps {
  tasks: Task[];
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
  suggestedTasks?: Task[];
  totalTime: number;
  onCreateTask?: (input: CreateTaskInput) => Promise<any>;
  onUpdateTask?: (id: string, input: UpdateTaskInput) => Promise<boolean>;
  onDeleteTask?: (id: string) => Promise<boolean>;
}

type GroupBy = 'none' | 'area' | 'priority';

export function TaskPoolSidebar({ 
  tasks, 
  onDragStart, 
  onDragEnd, 
  suggestedTasks = [],
  totalTime,
  onCreateTask,
  onUpdateTask,
  onDeleteTask
}: TaskPoolSidebarProps) {
  const { categories } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('area');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(categories.map(c => c.name))
  );
  const [isRealigning, setIsRealigning] = useState(false);

  const categoryNames = useMemo(() => categories.map(c => c.name), [categories]);
  const categoryNamesLower = useMemo(() => categories.map(c => c.name.toLowerCase()), [categories]);

  // Detect misaligned tasks: tasks with life_areas that don't match any current category
  const misalignedTasks = useMemo(() => {
    return tasks.filter(t => {
      if (!t.life_areas || t.life_areas.length === 0) return false;
      return t.life_areas.some(area => 
        !categoryNamesLower.includes(area.toLowerCase())
      );
    });
  }, [tasks, categoryNamesLower]);

  const handleRealign = useCallback(async () => {
    if (!onUpdateTask || misalignedTasks.length === 0) return;
    setIsRealigning(true);
    
    let fixedCount = 0;
    for (const task of misalignedTasks) {
      const currentAreas = task.life_areas || [];
      const newAreas = currentAreas.filter(area => 
        categoryNamesLower.includes(area.toLowerCase())
      ).map(area => {
        // Normalize casing to match current category name
        const idx = categoryNamesLower.indexOf(area.toLowerCase());
        return idx >= 0 ? categoryNames[idx] : area;
      });
      
      const areasChanged = 
        newAreas.length !== currentAreas.length || 
        !currentAreas.every((a, i) => newAreas[i] === a);
      
      if (areasChanged) {
        const success = await onUpdateTask(task.id, { life_areas: newAreas.length > 0 ? newAreas : [] });
        if (success) fixedCount++;
      }
    }
    
    setIsRealigning(false);
    toast.success(`Realigned ${fixedCount} task${fixedCount !== 1 ? 's' : ''} to current life areas`);
  }, [misalignedTasks, onUpdateTask, categoryNames, categoryNamesLower]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(t => !t.completed);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(query) ||
        (t.life_areas || []).some(a => a.includes(query))
      );
    }
    
    return filtered;
  }, [tasks, searchQuery]);

  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Tasks': filteredTasks };
    }
    
    if (groupBy === 'area') {
      const groups: Record<string, Task[]> = {};
      categories.forEach(c => {
        groups[c.name] = [];
      });
      groups['unassigned'] = [];
      
      filteredTasks.forEach(task => {
        const areas = task.life_areas || [];
        if (areas.length === 0) {
          groups['unassigned'].push(task);
        } else {
          areas.forEach(area => {
            const matchedCat = categories.find(c => c.name.toLowerCase() === area.toLowerCase());
            const key = matchedCat ? matchedCat.name : area;
            if (!groups[key]) groups[key] = [];
            groups[key].push(task);
          });
        }
      });
      
      return Object.fromEntries(
        Object.entries(groups).filter(([_, tasks]) => tasks.length > 0)
      );
    }
    
    if (groupBy === 'priority') {
      const groups: Record<string, Task[]> = {
        '1': [], '2': [], '3': [], '4': [],
      };
      
      filteredTasks.forEach(task => {
        const priority = String(task.priority || 4);
        groups[priority].push(task);
      });
      
      return Object.fromEntries(
        Object.entries(groups).filter(([_, tasks]) => tasks.length > 0)
      );
    }
    
    return { 'All Tasks': filteredTasks };
  }, [filteredTasks, groupBy, categories]);

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const getGroupLabel = (key: string) => {
    if (groupBy === 'area') {
      const cat = categories.find(c => c.name.toLowerCase() === key.toLowerCase());
      return cat?.name || (key === 'unassigned' ? 'Unassigned' : key);
    }
    if (groupBy === 'priority') {
      const labels: Record<string, string> = {
        '1': '🔴 Urgent', '2': '🟠 High', '3': '🟡 Medium', '4': '🔵 Low',
      };
      return labels[key] || key;
    }
    return key;
  };

  const getGroupColor = (key: string) => {
    if (groupBy === 'area') {
      const cat = categories.find(c => c.name.toLowerCase() === key.toLowerCase());
      if (cat) return GOOGLE_CALENDAR_COLORS[cat.googleColorId]?.hex;
    }
    return undefined;
  };

  const formatTotalTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg">Task Pool</h2>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {formatTotalTime(totalTime)}
          </Badge>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-1">
          <Button 
            variant={groupBy === 'area' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => setGroupBy('area')}
            className="flex-1"
          >
            By Area
          </Button>
          <Button 
            variant={groupBy === 'priority' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => setGroupBy('priority')}
            className="flex-1"
          >
            By Priority
          </Button>
          <Button 
            variant={groupBy === 'none' ? 'secondary' : 'ghost'} 
            size="sm"
            onClick={() => setGroupBy('none')}
            className="flex-1"
          >
            All
          </Button>
        </div>
      </div>

      {misalignedTasks.length > 0 && (
        <div className="p-3 mx-4 mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {misalignedTasks.length} task{misalignedTasks.length !== 1 ? 's have' : ' has'} life areas that don't match current categories
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs gap-1.5 border-amber-500/30 hover:bg-amber-500/20"
            onClick={handleRealign}
            disabled={isRealigning}
          >
            <Wand2 className="h-3.5 w-3.5" />
            {isRealigning ? 'Realigning...' : 'Auto-fix task areas'}
          </Button>
        </div>
      )}

        <div className="p-4 border-b bg-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Suggestions</span>
          </div>
          <div className="space-y-2">
            {suggestedTasks.slice(0, 3).map((task) => (
              <DraggableTaskBlock
                key={task.id}
                task={task}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onUpdate={onUpdateTask}
                onDelete={onDeleteTask}
                compact
              />
            ))}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {Object.entries(groupedTasks).map(([group, groupTasks]) => (
            <Collapsible 
              key={group} 
              open={expandedGroups.has(group)}
              onOpenChange={() => toggleGroup(group)}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-1 text-sm font-medium hover:text-primary transition-colors">
                {expandedGroups.has(group) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getGroupColor(group) || 'hsl(var(--muted))' }}
                />
                <span>{getGroupLabel(group)}</span>
                <Badge variant="outline" className="ml-auto h-5 text-xs">
                  {groupTasks.length}
                </Badge>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <AnimatePresence mode="popLayout">
                  <div className="space-y-2 mt-2 pl-4">
                    {groupTasks.map((task) => (
                      <DraggableTaskBlock
                        key={task.id}
                        task={task}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        onUpdate={onUpdateTask}
                        onDelete={onDeleteTask}
                        compact
                      />
                    ))}
                  </div>
                </AnimatePresence>
              </CollapsibleContent>
            </Collapsible>
          ))}
          
          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No tasks to schedule</p>
              <p className="text-xs mt-1">Add tasks in the Tasks page</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
