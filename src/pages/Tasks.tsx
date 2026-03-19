import { useState, useMemo } from 'react';
import { Navigation } from '@/components/Navigation';
import { TaskItem } from '@/components/TaskItem';
import { AddTaskForm } from '@/components/AddTaskForm';
import { ChiefOfStaffChat } from '@/components/ChiefOfStaffChat';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  LogIn, 
  Loader2, 
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Inbox,
  Calendar,
  Sparkles,
  PanelRightClose,
  PanelRight,
  Repeat
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';

type FilterType = 'all' | 'today' | 'upcoming' | 'completed' | 'recurring';

export default function Tasks() {
  const { user } = useAuth();
  const { tasks, isLoading, createTask, updateTask, deleteTask, toggleComplete } = useTasks();
  const [showCompleted, setShowCompleted] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAssistant, setShowAssistant] = useState(true);

  // Filter out scheduled tasks from the main view
  const unscheduledTasks = useMemo(() => 
    tasks.filter(t => !t.scheduled_at),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    let filtered = unscheduledTasks;

    switch (filter) {
      case 'today':
        filtered = unscheduledTasks.filter(t => 
          !t.completed && t.due_date && isToday(parseISO(t.due_date))
        );
        break;
      case 'upcoming':
        filtered = unscheduledTasks.filter(t => 
          !t.completed && t.due_date && (isToday(parseISO(t.due_date)) || isTomorrow(parseISO(t.due_date)) || isThisWeek(parseISO(t.due_date)))
        );
        break;
      case 'completed':
        filtered = unscheduledTasks.filter(t => t.completed);
        break;
      case 'recurring':
        filtered = unscheduledTasks.filter(t => !t.completed && t.is_recurring);
        break;
      default:
        filtered = unscheduledTasks.filter(t => !t.completed);
    }

    return filtered;
  }, [unscheduledTasks, filter]);

  const completedTasks = useMemo(() => 
    unscheduledTasks.filter(t => t.completed),
    [unscheduledTasks]
  );

  const activeTasks = useMemo(() =>
    unscheduledTasks.filter(t => !t.completed),
    [unscheduledTasks]
  );

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <Navigation />
        <main className="flex-1 pb-20 md:pb-0 flex items-center justify-center p-6">
          <motion.div 
            className="text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-4 rounded-full bg-muted inline-block">
              <LogIn className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-serif text-xl">Sign in to view your tasks</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Create and manage your tasks to stay organized and productive.
            </p>
            <Button asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Navigation />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Tasks List */}
        <main className={cn(
          "flex-1 pb-20 md:pb-0 flex flex-col overflow-hidden transition-all",
          showAssistant ? "md:w-1/2 lg:w-3/5" : "w-full"
        )}>
          <div className="p-4 md:p-6 border-b border-border bg-background flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl mb-2">Tasks</h1>
              <p className="text-muted-foreground text-sm">
                {activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}
                {completedTasks.length > 0 && ` · ${completedTasks.length} completed`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAssistant(!showAssistant)}
              className="hidden md:flex"
              title={showAssistant ? "Hide assistant" : "Show assistant"}
            >
              {showAssistant ? <PanelRightClose className="h-5 w-5" /> : <PanelRight className="h-5 w-5" />}
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-3xl mx-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="all" className="gap-2">
                      <Inbox className="h-4 w-4" />
                      Inbox
                    </TabsTrigger>
                    <TabsTrigger value="today" className="gap-2">
                      <Circle className="h-4 w-4" />
                      Today
                    </TabsTrigger>
                    <TabsTrigger value="upcoming" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      Upcoming
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Done
                    </TabsTrigger>
                    <TabsTrigger value="recurring" className="gap-2">
                      <Repeat className="h-4 w-4" />
                      Recurring
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={filter} className="mt-0">
                    <div className="space-y-2 mb-4">
                      {filteredTasks.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="p-4 rounded-full bg-muted inline-block mb-4">
                            {filter === 'completed' ? (
                              <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
                            ) : (
                              <Inbox className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                          <h3 className="font-medium text-lg mb-1">
                            {filter === 'completed' 
                              ? 'No completed tasks yet' 
                              : filter === 'today'
                              ? 'No tasks due today'
                              : filter === 'upcoming'
                              ? 'No upcoming tasks'
                              : filter === 'recurring'
                              ? 'No recurring tasks'
                              : 'All caught up!'
                            }
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {filter === 'completed'
                              ? 'Complete some tasks to see them here'
                              : 'Add a task to get started'
                            }
                          </p>
                        </div>
                      ) : (
                        filteredTasks.map((task) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                          >
                            <TaskItem
                              task={task}
                              onToggleComplete={toggleComplete}
                              onUpdate={updateTask}
                              onDelete={deleteTask}
                            />
                          </motion.div>
                        ))
                      )}
                    </div>

                    {filter !== 'completed' && (
                      <AddTaskForm onAdd={createTask} />
                    )}

                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </main>

        {/* AI Assistant Panel */}
        {showAssistant && (
          <aside className="hidden md:flex md:w-1/2 lg:w-2/5 border-l border-border h-[calc(100vh-0px)] overflow-hidden">
            <ChiefOfStaffChat />
          </aside>
        )}
      </div>

      {/* Mobile FAB for assistant */}
      <Button
        className="fixed bottom-24 right-4 md:hidden h-14 w-14 rounded-full shadow-lg"
        onClick={() => setShowAssistant(!showAssistant)}
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      {/* Mobile Assistant Sheet */}
      {showAssistant && (
        <div className="fixed inset-0 z-50 md:hidden bg-background">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Chief of Staff</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAssistant(false)}>
                Close
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChiefOfStaffChat />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
