import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useTasks, LIFE_AREAS, TIME_ESTIMATES, CreateTaskInput } from '@/hooks/useTasks';
import { Send, Bot, User, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tasks?: ExtractedTask[];
}

interface ExtractedTask {
  title: string;
  description?: string;
  time_estimate_minutes: number;
  life_area: string;
  priority: number;
}

export function ChiefOfStaffChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your Chief of Staff. Tell me about the tasks on your mind - I'll help organize them using GTD methodology. Just brain dump everything you need to do, and I'll extract the tasks, estimate time, categorize by life area, and set priorities."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { createTask } = useTasks();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addTasksToList = async (tasks: ExtractedTask[]) => {
    let addedCount = 0;
    for (const task of tasks) {
      const input: CreateTaskInput = {
        title: task.title,
        description: task.description,
        time_estimate_minutes: task.time_estimate_minutes,
        life_area: task.life_area,
        priority: task.priority,
      };
      const result = await createTask(input);
      if (result) addedCount++;
    }
    return addedCount;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const chatMessages = [
        ...messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({
          role: m.role,
          content: m.content
        })),
        { role: 'user', content: userMessage }
      ];

      const { data, error } = await supabase.functions.invoke('chief-of-staff', {
        body: { messages: chatMessages, type: 'chat' }
      });

      if (error) throw error;

      const choice = data.choices?.[0];
      if (!choice) throw new Error('No response from AI');

      let assistantContent = '';
      let extractedTasks: ExtractedTask[] = [];

      // Check for tool calls
      if (choice.message?.tool_calls) {
        for (const toolCall of choice.message.tool_calls) {
          if (toolCall.function?.name === 'add_tasks') {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              extractedTasks = args.tasks || [];
              
              // Add tasks to the database
              const addedCount = await addTasksToList(extractedTasks);
              toast.success(`Added ${addedCount} task${addedCount !== 1 ? 's' : ''} to your list`);
            } catch (e) {
              console.error('Failed to parse tool call:', e);
            }
          }
        }
      }

      // Get the assistant's message content
      assistantContent = choice.message?.content || '';
      
      // If no content but we have tasks, generate a summary
      if (!assistantContent && extractedTasks.length > 0) {
        assistantContent = `I've added ${extractedTasks.length} task${extractedTasks.length !== 1 ? 's' : ''} to your list. Would you like me to help prioritize them or find time in your calendar to schedule them?`;
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantContent,
        tasks: extractedTasks.length > 0 ? extractedTasks : undefined
      }]);

    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = error.message || 'Failed to get response';
      toast.error(errorMessage);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getLifeAreaColor = (area: string) => {
    const found = LIFE_AREAS.find(a => a.value === area);
    return found?.color || 'bg-gray-500';
  };

  const getTimeLabel = (minutes: number) => {
    const found = TIME_ESTIMATES.find(t => t.value === minutes);
    return found?.label || `${minutes} min`;
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return 'Urgent';
      case 2: return 'Important';
      case 3: return 'Normal';
      case 4: return 'Low';
      default: return 'Normal';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
        <div className="p-2 rounded-full bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Chief of Staff</h3>
          <p className="text-xs text-muted-foreground">Your AI task assistant</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {/* Show extracted tasks */}
                {message.tasks && message.tasks.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.tasks.map((task, taskIndex) => (
                      <div key={taskIndex} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 border text-left">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{task.title}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getTimeLabel(task.time_estimate_minutes)}
                            </Badge>
                            <Badge className={`text-xs text-white ${getLifeAreaColor(task.life_area)}`}>
                              {task.life_area}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {getPriorityLabel(task.priority)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <form 
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me about your tasks..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Try: "I need to call mom, review the quarterly report, and go to the gym"
        </p>
      </div>
    </div>
  );
}
