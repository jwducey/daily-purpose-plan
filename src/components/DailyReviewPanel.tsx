import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useDailyReview } from '@/hooks/useDailyReview';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/hooks/useAuth';
import { ClipboardCheck, Plus, Check, X, User, Star, AlertCircle, ChevronRight, Activity, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';

type ReviewStep = 'schedule' | 'activities' | 'connections' | 'summary';

export function DailyReviewPanel() {
  const { user: authUser } = useAuth();
  const { categories } = useUser();
  const {
    todayReview,
    activities,
    connections,
    contacts,
    staleContacts,
    isLoading,
    updateReview,
    addActivity,
    addConnection,
  } = useDailyReview();

  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<ReviewStep>('schedule');
  const [followedSchedule, setFollowedSchedule] = useState<boolean | null>(null);
  const [reflectionNotes, setReflectionNotes] = useState('');
  
  // Activity form state
  const [newActivity, setNewActivity] = useState('');
  const [activityLifeArea, setActivityLifeArea] = useState('');
  const [activityDuration, setActivityDuration] = useState('');
  const [activityWasPlanned, setActivityWasPlanned] = useState(false);
  
  // Connection form state
  const [newConnection, setNewConnection] = useState('');
  const [connectionNotes, setConnectionNotes] = useState('');
  const [connectionIsHighValue, setConnectionIsHighValue] = useState(false);
  const [showContactSuggestions, setShowContactSuggestions] = useState(false);

  // Load existing review data
  useEffect(() => {
    if (todayReview) {
      setFollowedSchedule(todayReview.followed_schedule ?? null);
      setReflectionNotes(todayReview.reflection_notes || '');
    }
  }, [todayReview]);

  // Filter contacts for autocomplete
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(newConnection.toLowerCase()) &&
    !connections.some(conn => conn.contact_name.toLowerCase() === c.name.toLowerCase())
  );

  const handleScheduleAnswer = async (answer: boolean) => {
    setFollowedSchedule(answer);
    await updateReview({ followed_schedule: answer });
    if (!answer) {
      setCurrentStep('activities');
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.trim()) return;
    
    await addActivity({
      activity_description: newActivity,
      life_area: activityLifeArea || undefined,
      duration_minutes: activityDuration ? parseInt(activityDuration) : undefined,
      was_planned: activityWasPlanned,
    });
    
    setNewActivity('');
    setActivityLifeArea('');
    setActivityDuration('');
    setActivityWasPlanned(false);
  };

  const handleAddConnection = async () => {
    if (!newConnection.trim()) return;
    
    await addConnection(newConnection, connectionNotes || undefined, connectionIsHighValue);
    
    setNewConnection('');
    setConnectionNotes('');
    setConnectionIsHighValue(false);
    setShowContactSuggestions(false);
  };

  const handleSaveReflection = async () => {
    await updateReview({ reflection_notes: reflectionNotes });
  };

  const selectContact = (contactName: string, isHighValue: boolean) => {
    setNewConnection(contactName);
    setConnectionIsHighValue(isHighValue);
    setShowContactSuggestions(false);
  };

  if (!authUser) return null;

  const steps: { key: ReviewStep; label: string; icon: React.ReactNode }[] = [
    { key: 'schedule', label: 'Schedule', icon: <ClipboardCheck className="w-4 h-4" /> },
    { key: 'activities', label: 'Activities', icon: <Activity className="w-4 h-4" /> },
    { key: 'connections', label: 'Connections', icon: <Users className="w-4 h-4" /> },
    { key: 'summary', label: 'Summary', icon: <Check className="w-4 h-4" /> },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-24 right-6 md:bottom-6 z-40 h-12 w-12 rounded-full shadow-lg bg-life-energy hover:bg-life-energy/90 text-primary-foreground border-0"
        >
          <ClipboardCheck className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-life-energy" />
              Daily Review
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </SheetHeader>

          {/* Step indicators */}
          <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/30">
            {steps.map((step, index) => (
              <button
                key={step.key}
                onClick={() => setCurrentStep(step.key)}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors",
                  currentStep === step.key 
                    ? "bg-life-energy text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {step.icon}
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            ))}
          </div>

          {/* Stale contacts alert */}
          {staleContacts.length > 0 && (
            <div className="mx-6 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Reconnect with high-value contacts
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {staleContacts.slice(0, 3).map(contact => (
                      <Badge 
                        key={contact.id} 
                        variant="outline" 
                        className="text-xs cursor-pointer hover:bg-amber-500/10"
                        onClick={() => {
                          setNewConnection(contact.name);
                          setConnectionIsHighValue(true);
                          setCurrentStep('connections');
                        }}
                      >
                        {contact.name}
                        {contact.last_connected_at && (
                          <span className="ml-1 text-muted-foreground">
                            ({differenceInDays(new Date(), new Date(contact.last_connected_at))}d)
                          </span>
                        )}
                      </Badge>
                    ))}
                    {staleContacts.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{staleContacts.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 px-6">
            <div className="py-4 space-y-6">
              <AnimatePresence mode="wait">
                {/* Step 1: Schedule check */}
                {currentStep === 'schedule' && (
                  <motion.div
                    key="schedule"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-medium">Did you follow your schedule today?</h3>
                    
                    <div className="flex gap-3">
                      <Button
                        variant={followedSchedule === true ? "default" : "outline"}
                        className={cn(
                          "flex-1",
                          followedSchedule === true && "bg-green-600 hover:bg-green-700"
                        )}
                        onClick={() => handleScheduleAnswer(true)}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Yes
                      </Button>
                      <Button
                        variant={followedSchedule === false ? "default" : "outline"}
                        className={cn(
                          "flex-1",
                          followedSchedule === false && "bg-amber-600 hover:bg-amber-700"
                        )}
                        onClick={() => handleScheduleAnswer(false)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Not fully
                      </Button>
                    </div>

                    {followedSchedule === true && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-lg bg-green-500/10 border border-green-500/20"
                      >
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Great job staying on track! Would you like to log any connections you made?
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => setCurrentStep('connections')}
                        >
                          Log connections <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </motion.div>
                    )}

                    {followedSchedule === false && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <Label>Where did you fall short?</Label>
                        <Textarea
                          placeholder="What happened? What got in the way?"
                          value={reflectionNotes}
                          onChange={(e) => setReflectionNotes(e.target.value)}
                          onBlur={handleSaveReflection}
                          rows={3}
                        />
                        <Button 
                          className="w-full"
                          onClick={() => setCurrentStep('activities')}
                        >
                          Log what I did instead <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Step 2: Activities */}
                {currentStep === 'activities' && (
                  <motion.div
                    key="activities"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-medium">What did you do instead?</h3>
                    
                    {/* Existing activities */}
                    {activities.length > 0 && (
                      <div className="space-y-2">
                        {activities.map(activity => (
                          <div 
                            key={activity.id}
                            className="p-3 rounded-lg bg-muted/50 flex items-start justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium">{activity.activity_description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {activity.life_area && (
                                  <Badge variant="outline" className="text-xs">
                                    {categories.find(c => c.name.toLowerCase() === activity.life_area)?.name || activity.life_area}
                                  </Badge>
                                )}
                                {activity.duration_minutes && (
                                  <span className="text-xs text-muted-foreground">
                                    {activity.duration_minutes} min
                                  </span>
                                )}
                                {activity.was_planned && (
                                  <Badge variant="secondary" className="text-xs">Planned</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Separator />

                    {/* Add new activity */}
                    <div className="space-y-3">
                      <Input
                        placeholder="What activity did you do?"
                        value={newActivity}
                        onChange={(e) => setNewActivity(e.target.value)}
                      />
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Life Area</Label>
                          <Select value={activityLifeArea} onValueChange={setActivityLifeArea}>
                            <SelectTrigger>
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.name.toLowerCase()}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label className="text-xs">Duration (min)</Label>
                          <Input
                            type="number"
                            placeholder="30"
                            value={activityDuration}
                            onChange={(e) => setActivityDuration(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Was this planned?</Label>
                        <Switch
                          checked={activityWasPlanned}
                          onCheckedChange={setActivityWasPlanned}
                        />
                      </div>

                      <Button 
                        className="w-full"
                        onClick={handleAddActivity}
                        disabled={!newActivity.trim()}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Activity
                      </Button>
                    </div>

                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => setCurrentStep('connections')}
                    >
                      Continue to Connections <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </motion.div>
                )}

                {/* Step 3: Connections */}
                {currentStep === 'connections' && (
                  <motion.div
                    key="connections"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-medium">Who did you connect with today?</h3>
                    
                    {/* Existing connections */}
                    {connections.length > 0 && (
                      <div className="space-y-2">
                        {connections.map(conn => {
                          const contact = contacts.find(c => c.id === conn.contact_id);
                          return (
                            <div 
                              key={conn.id}
                              className="p-3 rounded-lg bg-muted/50 flex items-center gap-3"
                            >
                              <div className="p-2 rounded-full bg-background">
                                <User className="w-4 h-4" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium flex items-center gap-2">
                                  {conn.contact_name}
                                  {contact?.is_high_value && (
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  )}
                                </p>
                                {conn.connection_notes && (
                                  <p className="text-xs text-muted-foreground">{conn.connection_notes}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <Separator />

                    {/* Add new connection */}
                    <div className="space-y-3 relative">
                      <div className="relative">
                        <Input
                          placeholder="Enter person's name..."
                          value={newConnection}
                          onChange={(e) => {
                            setNewConnection(e.target.value);
                            setShowContactSuggestions(e.target.value.length > 0);
                          }}
                          onFocus={() => setShowContactSuggestions(newConnection.length > 0)}
                        />
                        
                        {/* Contact suggestions dropdown */}
                        {showContactSuggestions && filteredContacts.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-10 max-h-48 overflow-auto">
                            {filteredContacts.map(contact => (
                              <button
                                key={contact.id}
                                className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2"
                                onClick={() => selectContact(contact.name, contact.is_high_value)}
                              >
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="flex-1">{contact.name}</span>
                                {contact.is_high_value && (
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <Textarea
                        placeholder="Notes about your connection (optional)"
                        value={connectionNotes}
                        onChange={(e) => setConnectionNotes(e.target.value)}
                        rows={2}
                      />

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Star className={cn(
                            "w-4 h-4",
                            connectionIsHighValue ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
                          )} />
                          <Label className="text-sm">High-value connection</Label>
                        </div>
                        <Switch
                          checked={connectionIsHighValue}
                          onCheckedChange={setConnectionIsHighValue}
                        />
                      </div>

                      <Button 
                        className="w-full"
                        onClick={handleAddConnection}
                        disabled={!newConnection.trim()}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Connection
                      </Button>
                    </div>

                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => setCurrentStep('summary')}
                    >
                      View Summary <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </motion.div>
                )}

                {/* Step 4: Summary */}
                {currentStep === 'summary' && (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-medium">Today's Summary</h3>
                    
                    <div className="space-y-4">
                      {/* Schedule status */}
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Schedule</span>
                        </div>
                        {followedSchedule === true && (
                          <Badge className="bg-green-600">Followed schedule</Badge>
                        )}
                        {followedSchedule === false && (
                          <Badge className="bg-amber-600">Deviated from schedule</Badge>
                        )}
                        {followedSchedule === null && (
                          <Badge variant="outline">Not reviewed yet</Badge>
                        )}
                        {reflectionNotes && (
                          <p className="text-sm text-muted-foreground mt-2">{reflectionNotes}</p>
                        )}
                      </div>

                      {/* Activities summary */}
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Activities</span>
                          <Badge variant="secondary" className="ml-auto">{activities.length}</Badge>
                        </div>
                        {activities.length > 0 ? (
                          <ul className="text-sm space-y-1">
                            {activities.map(a => (
                              <li key={a.id} className="text-muted-foreground">
                                • {a.activity_description}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No activities logged</p>
                        )}
                      </div>

                      {/* Connections summary */}
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Connections</span>
                          <Badge variant="secondary" className="ml-auto">{connections.length}</Badge>
                        </div>
                        {connections.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {connections.map(c => {
                              const contact = contacts.find(ct => ct.id === c.contact_id);
                              return (
                                <Badge key={c.id} variant="outline" className="flex items-center gap-1">
                                  {c.contact_name}
                                  {contact?.is_high_value && (
                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  )}
                                </Badge>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No connections logged</p>
                        )}
                      </div>
                    </div>

                    <Button 
                      className="w-full"
                      onClick={() => setIsOpen(false)}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Complete Review
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
