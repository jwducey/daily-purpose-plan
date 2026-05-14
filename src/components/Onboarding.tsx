import { useState, useMemo, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  Target,
  Sparkles,
  Loader2,
  Calendar as CalendarIcon,
  ListTodo,
  Layers,
  Pencil,
  Plus,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { GOOGLE_CALENDAR_COLORS } from '@/types/user';

export function Onboarding() {
  const { completeOnboarding, categories, updateCategory, deleteCategory, addCategory } = useUser();
  const [step, setStep] = useState(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isConnectingCal, setIsConnectingCal] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: 30,
    expectedLifespan: 80,
  });

  // Life areas selection: track which categories are "on"
  const [enabledAreaIds, setEnabledAreaIds] = useState<Set<string>>(
    () => new Set(categories.map(c => c.id))
  );

  // Auto-enable any newly added category so it shows up in budget step
  useEffect(() => {
    setEnabledAreaIds(prev => {
      const next = new Set(prev);
      let changed = false;
      categories.forEach(c => {
        if (!prev.has(c.id)) {
          next.add(c.id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [categories]);

  // Remove deprecated default categories if they exist from prior sessions
  useEffect(() => {
    const deprecated = ['emotional', 'impact', 'legacy'];
    categories
      .filter(c => deprecated.includes(c.name.trim().toLowerCase()))
      .forEach(c => deleteCategory(c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // First task
  const [firstTask, setFirstTask] = useState('');

  // Empty slots for adding new life areas
  const EMPTY_SLOTS = 3;
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [slotName, setSlotName] = useState('');

  const commitNewArea = () => {
    const trimmed = slotName.trim();
    if (trimmed) addCategory(trimmed);
    setActiveSlot(null);
    setSlotName('');
  };

  const steps = [
    { key: 'welcome', title: 'Welcome to LifeWealth', subtitle: "Your most finite resource is time. Let's make every moment count.", icon: Clock },
    { key: 'name', title: 'What should we call you?', subtitle: "We'll personalize your experience.", icon: Sparkles },
    { key: 'age', title: 'How old are you?', subtitle: 'This helps us calculate your life remaining.', icon: Target },
    { key: 'lifespan', title: 'Expected lifespan', subtitle: 'Be realistic. Average is around 78–82 years.', icon: Target },
    { key: 'reveal', title: 'Here is your life in weeks', subtitle: 'Every dot is a week. The filled ones are gone.', icon: Clock },
    { key: 'areas', title: 'Pick your life areas', subtitle: 'These categories shape how you budget time. Tap to toggle.', icon: Layers },
    { key: 'budget', title: 'Budget your week', subtitle: 'Each week you have 168 hours to allocate. Use the sliders to invest your time in the areas that matter most — your biggest commitments will rise to the top.', icon: Target },
    { key: 'gcal', title: 'Connect Google Calendar', subtitle: 'Color-code your time and sync events automatically.', icon: CalendarIcon },
    { key: 'task', title: 'Add your first task', subtitle: 'Capture one thing you want to get done.', icon: ListTodo },
  ] as const;

  const totalSteps = steps.length;
  const current = steps[step];
  const StepIcon = current.icon;

  const enabledAreas = useMemo(
    () => categories.filter(c => enabledAreaIds.has(c.id)),
    [categories, enabledAreaIds]
  );

  const totalBudget = useMemo(
    () => enabledAreas.reduce((s, c) => s + c.weeklyHoursTarget, 0),
    [enabledAreas]
  );

  const yearsRemaining = formData.expectedLifespan - formData.age;
  const weeksRemaining = yearsRemaining * 52;
  const weeksLived = formData.age * 52;
  const totalWeeks = formData.expectedLifespan * 52;

  const finishOnboarding = async () => {
    setIsFinishing(true);
    try {
      // Remove deselected categories
      const toRemove = categories.filter(c => !enabledAreaIds.has(c.id));
      toRemove.forEach(c => deleteCategory(c.id));

      // Save first task
      const taskTitle = firstTask.trim();
      if (taskTitle) {
        const { data: session } = await supabase.auth.getSession();
        const uid = session.session?.user?.id;
        if (uid) {
          await supabase.from('tasks').insert({
            user_id: uid,
            title: taskTitle,
            priority: 3,
          });
        }
      }

      // Complete profile
      const today = new Date();
      const birthDate = new Date(today.getFullYear() - formData.age, today.getMonth(), today.getDate());
      await completeOnboarding({
        name: formData.name,
        age: formData.age,
        expectedLifespan: formData.expectedLifespan,
        birthDate,
      });
    } catch (e) {
      console.error(e);
      toast.error('Something went wrong finishing onboarding.');
    } finally {
      setIsFinishing(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const canProceed = () => {
    if (current.key === 'name') return formData.name.trim().length > 0;
    if (current.key === 'areas') return enabledAreaIds.size > 0;
    return true;
  };

  const connectGoogleCalendar = async () => {
    setIsConnectingCal(true);
    try {
      const redirectUri = `${window.location.origin}/settings?google_callback=true`;
      const { data, error } = await supabase.functions.invoke('google-auth-url', {
        body: { redirectUri },
      });
      if (error) throw error;
      if (data?.url) {
        localStorage.setItem('google_oauth_pending', 'true');
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to start Google Calendar connection.');
      setIsConnectingCal(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-10">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === step
                  ? 'w-6 bg-life-energy'
                  : index < step
                  ? 'w-1.5 bg-life-energy/50'
                  : 'w-1.5 bg-muted-foreground/20'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-life-energy/10">
                <StepIcon className="w-8 h-8 text-life-energy" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-serif">{current.title}</h1>
              <p className="text-muted-foreground">{current.subtitle}</p>
            </div>

            <div className="pt-2">
              {current.key === 'welcome' && (
                <div className="space-y-6 text-center">
                  <p className="text-muted-foreground leading-relaxed">
                    Money can be earned back. Time cannot. LifeWealth helps you invest your life energy in what truly matters.
                  </p>
                </div>
              )}

              {current.key === 'name' && (
                <div className="space-y-4">
                  <Label htmlFor="name" className="sr-only">Your name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-center text-lg h-14"
                    autoFocus
                  />
                </div>
              )}

              {current.key === 'age' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <span className="text-6xl font-serif text-life-energy">{formData.age}</span>
                    <span className="text-2xl text-muted-foreground ml-2">years old</span>
                  </div>
                  <Slider
                    value={[formData.age]}
                    min={18}
                    max={100}
                    step={1}
                    onValueChange={(v) => setFormData({ ...formData, age: v[0] })}
                  />
                </div>
              )}

              {current.key === 'lifespan' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <span className="text-6xl font-serif text-life-energy">{formData.expectedLifespan}</span>
                    <span className="text-2xl text-muted-foreground ml-2">years</span>
                  </div>
                  <Slider
                    value={[formData.expectedLifespan]}
                    min={formData.age + 1}
                    max={120}
                    step={1}
                    onValueChange={(v) => setFormData({ ...formData, expectedLifespan: v[0] })}
                  />
                  <p className="text-center text-sm text-muted-foreground">
                    That's <span className="font-semibold text-foreground">{yearsRemaining} years</span> of life remaining
                  </p>
                </div>
              )}

              {current.key === 'reveal' && (
                <div className="space-y-4">
                  <div
                    className="grid gap-[2px] mx-auto"
                    style={{ gridTemplateColumns: 'repeat(52, minmax(0, 1fr))', maxWidth: 480 }}
                  >
                    {Array.from({ length: totalWeeks }).map((_, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-[1px] ${
                          i < weeksLived ? 'bg-life-energy/70' : 'bg-muted-foreground/15'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-2xl font-serif">{weeksRemaining.toLocaleString()} weeks left</p>
                    <p className="text-sm text-muted-foreground">Let's make them count.</p>
                  </div>
                </div>
              )}

              {current.key === 'areas' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(cat => {
                      const enabled = enabledAreaIds.has(cat.id);
                      const hex = GOOGLE_CALENDAR_COLORS[cat.googleColorId]?.hex || '#888';
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setEnabledAreaIds(prev => {
                              const next = new Set(prev);
                              if (next.has(cat.id)) next.delete(cat.id);
                              else next.add(cat.id);
                              return next;
                            });
                          }}
                          className={`relative flex items-center gap-2 p-3 rounded-xl border text-left transition ${
                            enabled
                              ? 'border-life-energy bg-life-energy/5'
                              : 'border-border bg-muted/20 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="text-sm font-medium truncate flex-1 min-w-0">{cat.name}</span>
                          {enabled && <Check className="w-4 h-4 text-life-energy flex-shrink-0" />}
                        </button>
                      );
                    })}

                    {Array.from({ length: EMPTY_SLOTS }).map((_, i) => {
                      const isActive = activeSlot === i;
                      return (
                        <div
                          key={`slot-${i}`}
                          className="relative flex items-center gap-2 p-3 rounded-xl border border-dashed border-border bg-transparent text-left transition hover:border-life-energy/60 hover:bg-life-energy/5"
                        >
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          {isActive ? (
                            <Input
                              value={slotName}
                              onChange={(e) => setSlotName(e.target.value)}
                              onBlur={commitNewArea}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitNewArea();
                                if (e.key === 'Escape') { setActiveSlot(null); setSlotName(''); }
                              }}
                              autoFocus
                              placeholder="Name this area"
                              className="h-7 text-sm px-2"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setActiveSlot(i); setSlotName(''); }}
                              className="flex-1 min-w-0 text-left text-sm text-muted-foreground"
                            >
                              Add a life area
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {current.key === 'budget' && (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  {[...enabledAreas]
                    .sort((a, b) => b.weeklyHoursTarget - a.weeklyHoursTarget)
                    .map(cat => {
                    const hex = GOOGLE_CALENDAR_COLORS[cat.googleColorId]?.hex || '#888';
                    return (
                      <div key={cat.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hex }} />
                            <span className="text-sm font-medium">{cat.name}</span>
                          </div>
                          <span className="text-sm tabular-nums text-muted-foreground">
                            {cat.weeklyHoursTarget}h
                          </span>
                        </div>
                        <Slider
                          value={[cat.weeklyHoursTarget]}
                          min={0}
                          max={80}
                          step={1}
                          onValueChange={(v) => updateCategory(cat.id, { weeklyHoursTarget: v[0] })}
                        />
                      </div>
                    );
                  })}
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Allocated</span>
                    <span
                      className={`tabular-nums font-medium ${
                        totalBudget > 168 ? 'text-destructive' : 'text-foreground'
                      }`}
                    >
                      {totalBudget} / 168 hours
                    </span>
                  </div>
                </div>
              )}

              {current.key === 'gcal' && (
                <div className="space-y-4 text-center">
                  <p className="text-muted-foreground leading-relaxed">
                    Sync events so your time budget reflects reality, and color-code activities by life area.
                  </p>
                  <Button
                    onClick={connectGoogleCalendar}
                    disabled={isConnectingCal}
                    className="w-full h-12 gap-2"
                    variant="secondary"
                  >
                    {isConnectingCal ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CalendarIcon className="w-4 h-4" />
                    )}
                    Connect Google Calendar
                  </Button>
                  <p className="text-xs text-muted-foreground">You can always connect later from Settings.</p>
                </div>
              )}

              {current.key === 'task' && (
                <div className="space-y-3">
                  <Label htmlFor="task" className="sr-only">First task</Label>
                  <Input
                    id="task"
                    placeholder="e.g. Plan tomorrow morning"
                    value={firstTask}
                    onChange={(e) => setFirstTask(e.target.value)}
                    className="h-12"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Optional — leave blank to skip.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <motion.div
          className="mt-10 space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {step === 0 ? (
            <>
              <Button
                onClick={async () => {
                  setIsGoogleLoading(true);
                  try {
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: { redirectTo: `${window.location.origin}/` },
                    });
                    if (error) toast.error('Google Sign-In failed: ' + error.message);
                  } catch {
                    toast.error('Failed to sign in with Google.');
                  } finally {
                    setIsGoogleLoading(false);
                  }
                }}
                disabled={isGoogleLoading}
                className="w-full h-14 text-lg font-medium gap-2"
                size="lg"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>
              <Button
                onClick={handleNext}
                variant="ghost"
                className="w-full h-12 text-base text-muted-foreground"
              >
                Continue without signing in
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleBack}
                variant="ghost"
                size="lg"
                className="h-14"
                disabled={isFinishing}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isFinishing}
                className="flex-1 h-14 text-lg font-medium gap-2"
                size="lg"
              >
                {isFinishing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : step === totalSteps - 1 ? (
                  <>Start My Journey<ArrowRight className="w-5 h-5" /></>
                ) : (
                  <>Continue<ArrowRight className="w-5 h-5" /></>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
