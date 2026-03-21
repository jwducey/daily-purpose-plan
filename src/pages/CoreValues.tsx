import { useState, useEffect, useCallback, useRef } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Heart, ChevronDown, ChevronUp, CheckCircle2, ArrowRight, Plus, Wind, Layers, Target, PenLine, Moon, ShieldCheck, ArrowLeft, BookOpen, Palette } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const CORE_VALUES_BY_CATEGORY: Record<string, string[]> = {
  'Integrity': [
    'Accountability', 'Candor', 'Commitment', 'Dependability', 'Dignity',
    'Honesty', 'Honor', 'Responsibility', 'Sincerity', 'Transparency',
    'Trust', 'Trustworthy', 'Truth',
  ],
  'Feelings': [
    'Acceptance', 'Comfort', 'Compassion', 'Contentment', 'Empathy',
    'Grace', 'Gratitude', 'Happiness', 'Hope', 'Inspiring',
    'Joy', 'Kindness', 'Love', 'Optimism', 'Passion',
    'Peace', 'Poise', 'Respect', 'Reverence', 'Satisfaction',
    'Serenity', 'Thankful', 'Tranquility', 'Welcoming',
  ],
  'Achievement': [
    'Accomplishment', 'Capable', 'Challenge', 'Competence', 'Credibility',
    'Determination', 'Development', 'Drive', 'Effectiveness', 'Empower',
    'Endurance', 'Excellence', 'Famous', 'Greatness', 'Growth',
    'Hard work', 'Improvement', 'Influence', 'Intensity', 'Leadership',
    'Mastery', 'Motivation', 'Performance', 'Persistence', 'Potential',
    'Power', 'Productivity', 'Professionalism', 'Prosperity', 'Recognition',
    'Results-oriented', 'Risk', 'Significance', 'Skill', 'Skillfulness',
    'Status', 'Success', 'Talent', 'Victory', 'Wealth', 'Winning',
  ],
  'Intelligence': [
    'Brilliance', 'Clever', 'Common sense', 'Decisiveness', 'Foresight',
    'Genius', 'Insightful', 'Knowledge', 'Learning', 'Logic',
    'Openness', 'Realistic', 'Reason', 'Reflective', 'Smart',
    'Thoughtful', 'Understanding', 'Vision', 'Wisdom',
  ],
  'Strength': [
    'Ambition', 'Assertiveness', 'Boldness', 'Confidence', 'Dedication',
    'Discipline', 'Ferocious', 'Fortitude', 'Restraint', 'Rigor',
    'Self-reliance', 'Temperance', 'Toughness', 'Vigor', 'Will',
  ],
  'Spirituality': [
    'Adaptability', 'Altruism', 'Balance', 'Charity', 'Communication',
    'Community', 'Connection', 'Consciousness', 'Contribution', 'Cooperation',
    'Courtesy', 'Devotion', 'Equality', 'Ethical', 'Fairness',
    'Family', 'Fidelity', 'Friendship', 'Generosity', 'Giving',
    'Goodness', 'Harmony', 'Humility', 'Loyalty', 'Maturity',
    'Meaning', 'Selfless', 'Sensitivity', 'Service', 'Sharing',
    'Spirit', 'Stewardship', 'Support', 'Sustainability', 'Teamwork',
    'Tolerance', 'Unity',
  ],
  'Creativity': [
    'Creation', 'Curiosity', 'Discovery', 'Exploration', 'Expressive',
    'Imagination', 'Innovation', 'Inquisitive', 'Intuitive', 'Originality',
    'Uniqueness', 'Wonder',
  ],
  'Enjoyment': [
    'Amusement', 'Enthusiasm', 'Experience', 'Fun', 'Humor',
    'Playfulness', 'Recreation', 'Spontaneous', 'Surprise',
  ],
  'Presence': [
    'Alertness', 'Attentive', 'Awareness', 'Beauty', 'Calm',
    'Clear', 'Concentration', 'Focus', 'Silence', 'Simplicity', 'Solitude',
  ],
  'Freedom': [
    'Independence', 'Individuality', 'Liberty',
  ],
  'Courage': [
    'Bravery', 'Conviction', 'Fearless', 'Valor',
  ],
  'Order': [
    'Accuracy', 'Careful', 'Certainty', 'Cleanliness', 'Consistency',
    'Control', 'Decisive', 'Economy', 'Justice', 'Lawful',
    'Moderation', 'Organization', 'Security', 'Stability', 'Structure',
    'Thorough', 'Timeliness',
  ],
  'Health': [
    'Energy', 'Vitality',
  ],
};

const VIRTUES_LIST = [
  'Acceptance', 'Assertiveness', 'Authenticity', 'Beauty', 'Caring', 'Cleanliness',
  'Commitment', 'Compassion', 'Confidence', 'Consideration', 'Contentment', 'Cooperation',
  'Courage', 'Creativity', 'Detachment', 'Determination', 'Dignity', 'Encouragement',
  'Enthusiasm', 'Ethical', 'Excellence', 'Fairness', 'Faith', 'Flexibility', 'Forgiveness',
  'Friendliness', 'Generosity', 'Gentleness', 'Graciousness', 'Gratitude', 'Harmonious',
  'Helpfulness', 'Honesty', 'Honor', 'Hope', 'Humility', 'Idealism', 'Integrity',
  'Imaginative', 'Joyfulness', 'Justice', 'Kindness', 'Love', 'Loyalty', 'Moderation',
  'Modesty', 'Optimistic', 'Orderliness', 'Passionate', 'Patience', 'Peace', 'Perseverance',
  'Preparedness', 'Purposefulness', 'Reliability', 'Respect', 'Responsibility', 'Reverence',
  'Self-discipline', 'Service', 'Sincerity', 'Tact', 'Temperate', 'Tenacious', 'Thankfulness',
  'Tolerance', 'Trust', 'Truthfulness', 'Understanding', 'Unity', 'Visionary', 'Wisdom', 'Wonder',
];

const CATEGORY_COLORS: Record<string, string> = {
  'Integrity': 'bg-blue-500/20 border-blue-500/40 text-black',
  'Feelings': 'bg-pink-500/20 border-pink-500/40 text-black',
  'Achievement': 'bg-amber-500/20 border-amber-500/40 text-black',
  'Intelligence': 'bg-cyan-500/20 border-cyan-500/40 text-black',
  'Strength': 'bg-red-500/20 border-red-500/40 text-black',
  'Spirituality': 'bg-purple-500/20 border-purple-500/40 text-black',
  'Creativity': 'bg-orange-500/20 border-orange-500/40 text-black',
  'Enjoyment': 'bg-green-500/20 border-green-500/40 text-black',
  'Presence': 'bg-teal-500/20 border-teal-500/40 text-black',
  'Freedom': 'bg-indigo-500/20 border-indigo-500/40 text-black',
  'Courage': 'bg-rose-500/20 border-rose-500/40 text-black',
  'Order': 'bg-slate-500/20 border-slate-500/40 text-black',
  'Health': 'bg-emerald-500/20 border-emerald-500/40 text-black',
};

const SELECTED_COLORS: Record<string, string> = {
  'Integrity': 'bg-blue-500 border-blue-400 text-white shadow-blue-500/30',
  'Feelings': 'bg-pink-500 border-pink-400 text-white shadow-pink-500/30',
  'Achievement': 'bg-amber-500 border-amber-400 text-white shadow-amber-500/30',
  'Intelligence': 'bg-cyan-500 border-cyan-400 text-white shadow-cyan-500/30',
  'Strength': 'bg-red-500 border-red-400 text-white shadow-red-500/30',
  'Spirituality': 'bg-purple-500 border-purple-400 text-white shadow-purple-500/30',
  'Creativity': 'bg-orange-500 border-orange-400 text-white shadow-orange-500/30',
  'Enjoyment': 'bg-green-500 border-green-400 text-white shadow-green-500/30',
  'Presence': 'bg-teal-500 border-teal-400 text-white shadow-teal-500/30',
  'Freedom': 'bg-indigo-500 border-indigo-400 text-white shadow-indigo-500/30',
  'Courage': 'bg-rose-500 border-rose-400 text-white shadow-rose-500/30',
  'Order': 'bg-slate-500 border-slate-400 text-white shadow-slate-500/30',
  'Health': 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/30',
};

const VALUE_COLOR_PRESETS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
  '#64748b', '#78716c',
];

const STEPS = [
  {
    number: 1,
    title: "Beginner's Mind",
    subtitle: 'Clear your mind and prepare',
    icon: Wind,
  },
  {
    number: 2,
    title: 'Select Values That Resonate',
    subtitle: 'Build your initial shortlist',
    icon: Heart,
  },
  {
    number: 3,
    title: 'Group Into Themes',
    subtitle: 'Cluster related values together',
    icon: Layers,
  },
  {
    number: 4,
    title: 'Narrow to Top 5–10',
    subtitle: "Identify what's essential",
    icon: Target,
  },
  {
    number: 5,
    title: 'Craft Values Statements',
    subtitle: 'Define what each value means to you',
    icon: PenLine,
  },
  {
    number: 6,
    title: 'Gut Check',
    subtitle: 'Sleep on it, then review',
    icon: Moon,
  },
  {
    number: 7,
    title: 'Live Your Values',
    subtitle: 'Put them into practice daily',
    icon: ShieldCheck,
  },
  {
    number: 8,
    title: 'Virtues to Study',
    subtitle: 'Select virtues for ongoing practice',
    icon: BookOpen,
  },
];

const CoreValues = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string[]>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    Object.keys(CORE_VALUES_BY_CATEGORY).forEach(cat => initial[cat] = true);
    return initial;
  });
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newValueText, setNewValueText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [beginnerReady, setBeginnerReady] = useState(false);
  // Theme groups for Step 3: each group is an ordered array of values (first = definer)
  const [themeGroups, setThemeGroups] = useState<{ id: string; color: string; values: string[] }[] | null>(null);
  const [draggedValue, setDraggedValue] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<{ groupId: string; index: number } | null>(null);
  const [valuesStatements, setValuesStatements] = useState<Record<string, string>>({});
  const [valuesColors, setValuesColors] = useState<Record<string, string>>({});
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Close color picker on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerOpen(null);
      }
    };
    if (colorPickerOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [colorPickerOpen]);

  const updateValueColor = (value: string, color: string) => {
    const updated = { ...valuesColors, [value]: color };
    setValuesColors(updated);
    localStorage.setItem('core-values-colors', JSON.stringify(updated));
    setColorPickerOpen(null);
  };

  useEffect(() => {
    const load = async () => {
      const savedColors = localStorage.getItem('core-values-colors');
      if (savedColors) setValuesColors(JSON.parse(savedColors));
      if (!user) {
        const saved = localStorage.getItem('core-values-shortlist');
        const savedCustom = localStorage.getItem('core-values-custom');
        const savedStatements = localStorage.getItem('core-values-statements');
        const savedStep = localStorage.getItem('core-values-step');
        const savedCompleted = localStorage.getItem('core-values-completed-steps');
        if (saved) setSelectedValues(JSON.parse(saved));
        if (savedCustom) setCustomValues(JSON.parse(savedCustom));
        if (savedStatements) setValuesStatements(JSON.parse(savedStatements));
        if (savedStep) setCurrentStep(parseInt(savedStep));
        if (savedCompleted) setCompletedSteps(JSON.parse(savedCompleted));
        setLoaded(true);
        return;
      }
      const { data } = await supabase
        .from('core_values_shortlist')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setSelectedValues(data.selected_values || []);
        setCustomValues((data.custom_values as Record<string, string[]>) || {});
        if ((data as any).values_statements) {
          setValuesStatements((data as any).values_statements as Record<string, string>);
        }
      } else {
        const saved = localStorage.getItem('core-values-shortlist');
        const savedCustom = localStorage.getItem('core-values-custom');
        const savedStatements = localStorage.getItem('core-values-statements');
        if (saved) setSelectedValues(JSON.parse(saved));
        if (savedCustom) setCustomValues(JSON.parse(savedCustom));
        if (savedStatements) setValuesStatements(JSON.parse(savedStatements));
      }
      const savedStep = localStorage.getItem('core-values-step');
      const savedCompleted = localStorage.getItem('core-values-completed-steps');
      if (savedStep) setCurrentStep(parseInt(savedStep));
      if (savedCompleted) setCompletedSteps(JSON.parse(savedCompleted));
      setLoaded(true);
    };
    load();
  }, [user]);

  // Save step progress
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('core-values-step', String(currentStep));
    localStorage.setItem('core-values-completed-steps', JSON.stringify(completedSteps));
  }, [currentStep, completedSteps, loaded]);

  // Save to DB (debounced)
  const saveToDb = useCallback(async (values: string[], custom: Record<string, string[]>, statements: Record<string, string>) => {
    if (!user) {
      localStorage.setItem('core-values-shortlist', JSON.stringify(values));
      localStorage.setItem('core-values-custom', JSON.stringify(custom));
      localStorage.setItem('core-values-statements', JSON.stringify(statements));
      return;
    }
    const { error } = await supabase
      .from('core_values_shortlist')
      .upsert({
        user_id: user.id,
        selected_values: values,
        custom_values: custom as any,
        values_statements: statements as any,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: 'user_id' });
    if (error) {
      console.error('Failed to save core values:', error);
      toast.error('Failed to save your values');
    }
  }, [user]);

  useEffect(() => {
    if (!loaded) return;
    const timeout = setTimeout(() => saveToDb(selectedValues, customValues, valuesStatements), 500);
    return () => clearTimeout(timeout);
  }, [selectedValues, customValues, valuesStatements, loaded, saveToDb]);

  const toggleValue = (value: string) => {
    setSelectedValues(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const addCustomValue = (category: string) => {
    const trimmed = newValueText.trim();
    if (!trimmed) return;
    const allValues = [
      ...Object.keys(CORE_VALUES_BY_CATEGORY),
      ...Object.values(CORE_VALUES_BY_CATEGORY).flat(),
      ...Object.values(customValues).flat(),
    ];
    if (allValues.some(v => v.toLowerCase() === trimmed.toLowerCase())) return;
    setCustomValues(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), trimmed],
    }));
    setSelectedValues(prev => [...prev, trimmed]);
    setNewValueText('');
    setAddingTo(null);
  };

  const getValuesForCategory = (category: string) => {
    return [...(CORE_VALUES_BY_CATEGORY[category] || []), ...(customValues[category] || [])];
  };

  const getCategoryForValue = (value: string): string => {
    if (CORE_VALUES_BY_CATEGORY[value]) return value;
    for (const [cat, vals] of Object.entries(CORE_VALUES_BY_CATEGORY)) {
      if (vals.includes(value)) return cat;
    }
    for (const [cat, vals] of Object.entries(customValues)) {
      if (vals.includes(value)) return cat;
    }
    return 'Integrity';
  };

  // Build initial theme groups from selected values when entering Step 3
  // Always include the category name as the first (definer) value
  const buildThemeGroups = useCallback(() => {
    const grouped: Record<string, string[]> = {};
    selectedValues.forEach(value => {
      const category = getCategoryForValue(value);
      if (!grouped[category]) grouped[category] = [];
      // Skip category names — we'll add them as definer below
      if (!Object.keys(CORE_VALUES_BY_CATEGORY).includes(value)) {
        grouped[category].push(value);
      }
    });
    return Object.entries(grouped).map(([cat, values]) => ({
      id: cat,
      color: cat,
      values: [cat, ...values], // Category name always first as definer
    }));
  }, [selectedValues, customValues]);

  // Initialize theme groups when step 3 is reached
  useEffect(() => {
    if (currentStep === 3 && !themeGroups) {
      setThemeGroups(buildThemeGroups());
    }
  }, [currentStep, themeGroups, buildThemeGroups]);

  const [journeyComplete, setJourneyComplete] = useState(false);
  const [resetConfirmStep, setResetConfirmStep] = useState(0); // 0=none, 1=first confirm, 2=confirmed

  // Auto-detect completed journey on load
  useEffect(() => {
    if (loaded && completedSteps.includes(8)) {
      setJourneyComplete(true);
    }
  }, [loaded, completedSteps]);

  const completeStep = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps(prev => [...prev, step]);
    }
    if (step < 8) {
      setCurrentStep(step + 1);
    } else if (step === 8) {
      setJourneyComplete(true);
      toast.success('Congratulations! Your core values and virtues journey is complete.');
    }
  };

  const goToStep = (step: number) => {
    // Can go to any completed step or the next available one
    if (step <= Math.max(...completedSteps, 0) + 1) {
      setCurrentStep(step);
    }
  };

  const totalValues = Object.keys(CORE_VALUES_BY_CATEGORY).length + Object.values(CORE_VALUES_BY_CATEGORY).flat().length + Object.values(customValues).flat().length;

  // ── Step Content Renderers ──

  const renderStep1 = () => (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="pt-8 pb-8">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 mx-auto rounded-full bg-life-energy/20 flex items-center justify-center"
          >
            <Wind className="w-10 h-10 text-life-energy" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground">Begin with a Beginner's Mind</h2>
          <p className="text-muted-foreground leading-relaxed">
            Before you start selecting values, take a moment to clear your mind. Let go of all preconceived notions about what your values "should" be.
          </p>
          <div className="bg-muted/30 rounded-xl p-6 text-left space-y-4">
            <p className="text-sm text-foreground font-medium">Try this:</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Take 3 slow, deep breaths</li>
              <li>• Release any tension in your body</li>
              <li>• Empty your mind of expectations</li>
              <li>• Approach this exercise with fresh eyes and curiosity</li>
            </ul>
          </div>
          <div className="flex items-center justify-center gap-3 pt-4">
            <Checkbox
              id="beginner-ready"
              checked={beginnerReady}
              onCheckedChange={(checked) => setBeginnerReady(checked === true)}
              className="data-[state=checked]:bg-life-energy data-[state=checked]:border-life-energy"
            />
            <label htmlFor="beginner-ready" className="text-sm text-foreground cursor-pointer select-none">
              I've cleared my mind and I'm ready to begin
            </label>
          </div>
          {beginnerReady && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Button
                onClick={() => completeStep(1)}
                className="bg-life-energy hover:bg-life-energy/90 text-primary-foreground"
              >
                Continue to Step 2 <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-6 pb-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Scan the values below by category. Click on any value that resonates with you — don't overthink it. Select all that feel important to create your initial shortlist. You can also click category names and add your own custom values.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <Badge variant="outline" className="text-sm px-3 py-1.5 border-life-energy/50 text-life-energy">
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {selectedValues.length} selected
            </Badge>
            <span className="text-xs text-muted-foreground">out of {totalValues} values</span>
            {selectedValues.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedValues([])}
                className="text-muted-foreground hover:text-destructive ml-auto"
              >
                Clear all
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Values Summary */}
      {selectedValues.length > 0 && (
        <Card className="border-life-energy/30 bg-life-energy/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-life-energy" />
              Your Shortlist ({selectedValues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {selectedValues.map(value => {
                const category = getCategoryForValue(value);
                return (
                  <motion.button
                    key={value}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={() => toggleValue(value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-all shadow-md',
                      SELECTED_COLORS[category]
                    )}
                  >
                    {value} ×
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Values by Category */}
      <div className="space-y-4">
        {Object.keys(CORE_VALUES_BY_CATEGORY).map(category => {
          const values = getValuesForCategory(category);
          const isCategorySelected = selectedValues.includes(category);
          const selectedInCategory = values.filter(v => selectedValues.includes(v)).length + (isCategorySelected ? 1 : 0);
          const isExpanded = expandedCategories[category];

          return (
            <Card key={category} className="border-border/50 bg-card/50 overflow-hidden">
              <CardHeader
                className="cursor-pointer select-none py-4"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); toggleValue(category); }}
                      className={cn(
                        'px-3.5 py-1.5 rounded-full text-sm font-bold border cursor-pointer transition-all duration-150',
                        isCategorySelected
                          ? cn(SELECTED_COLORS[category], 'shadow-lg')
                          : cn(CATEGORY_COLORS[category], 'hover:brightness-125')
                      )}
                    >
                      {category}
                    </motion.button>
                    <span className="text-xs text-muted-foreground">
                      {values.length} values
                    </span>
                    {selectedInCategory > 0 && (
                      <Badge variant="secondary" className="text-xs bg-life-energy/20 text-life-energy border-0">
                        {selectedInCategory} selected
                      </Badge>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <CardContent className="pt-0 pb-4">
                      <div className="flex flex-wrap gap-2 items-center">
                        {values.map(value => {
                          const isSelected = selectedValues.includes(value);
                          return (
                            <motion.button
                              key={value}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => toggleValue(value)}
                              className={cn(
                                'px-3.5 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-all duration-150',
                                isSelected
                                  ? cn(SELECTED_COLORS[category], 'shadow-lg')
                                  : cn(CATEGORY_COLORS[category], 'hover:brightness-125')
                              )}
                            >
                              {value}
                            </motion.button>
                          );
                        })}
                        {addingTo === category ? (
                          <form
                            className="inline-flex items-center gap-1"
                            onSubmit={(e) => { e.preventDefault(); addCustomValue(category); }}
                          >
                            <Input
                              autoFocus
                              value={newValueText}
                              onChange={(e) => setNewValueText(e.target.value)}
                              onBlur={() => { if (!newValueText.trim()) { setAddingTo(null); setNewValueText(''); } }}
                              placeholder="Type a value..."
                              className="h-8 w-36 text-sm rounded-full px-3"
                            />
                            <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full">
                              <CheckCircle2 className="w-4 h-4 text-life-energy" />
                            </Button>
                          </form>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setAddingTo(category); setNewValueText(''); }}
                            className="px-3 py-1.5 rounded-full text-sm font-medium border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-foreground hover:text-foreground transition-all flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {/* Complete Step 2 */}
      {selectedValues.length >= 10 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center pt-4">
          <Button
            onClick={() => completeStep(2)}
            className="bg-life-energy hover:bg-life-energy/90 text-primary-foreground"
          >
            Step 2 Complete — Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      )}
    </div>
  );

  const renderStep3 = () => {
    const groups = themeGroups || buildThemeGroups();

    const handleDragStart = (value: string) => {
      setDraggedValue(value);
    };

    const handleDragEnd = () => {
      if (draggedValue && dropPosition && themeGroups) {
        const newGroups = themeGroups.map(g => ({
          ...g,
          values: g.values.filter(v => v !== draggedValue),
        }));

        const targetGroup = newGroups.find(g => g.id === dropPosition.groupId);
        if (targetGroup) {
          targetGroup.values.splice(dropPosition.index, 0, draggedValue);
        }

        // Remove empty groups
        setThemeGroups(newGroups.filter(g => g.values.length > 0));
      }
      setDraggedValue(null);
      setDragOverGroupId(null);
      setDropPosition(null);
    };

    const handleRowDragOver = (e: React.DragEvent, groupId: string) => {
      e.preventDefault();
      setDragOverGroupId(groupId);
    };

    const handleRowDragLeave = () => {
      setDragOverGroupId(null);
    };

    const handleValueDragOver = (e: React.DragEvent, groupId: string, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverGroupId(groupId);
      setDropPosition({ groupId, index });
    };

    const handleRowDrop = (e: React.DragEvent, groupId: string) => {
      e.preventDefault();
      if (!dropPosition || dropPosition.groupId !== groupId) {
        // Dropped on the row but not on a specific position — append to end
        const group = groups.find(g => g.id === groupId);
        if (group) {
          setDropPosition({ groupId, index: group.values.length });
        }
      }
      // handleDragEnd will process the move
    };

    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-8 pb-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-foreground">Group Into Related Themes</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              <strong>Drag and drop</strong> any value to reorder within a group or move between groups. The <strong>first value</strong> (leftmost) in each row is the theme definer. Arrange left to right from most to least important.
            </p>
            <div className="space-y-2">
              {groups.map(group => (
                <div
                  key={group.id}
                  onDragOver={(e) => handleRowDragOver(e, group.id)}
                  onDragLeave={handleRowDragLeave}
                  onDrop={(e) => handleRowDrop(e, group.id)}
                  className={cn(
                    'flex items-center gap-2 flex-wrap rounded-xl px-3 py-2.5 border-2 border-dashed transition-all min-h-[44px]',
                    dragOverGroupId === group.id
                      ? 'border-life-energy bg-life-energy/10'
                      : 'border-transparent hover:border-muted-foreground/20'
                  )}
                >
                  {group.values.map((value, index) => {
                    const isDefiner = index === 0;
                    return (
                      <motion.span
                        key={value}
                        layout
                        draggable
                        onDragStart={() => handleDragStart(value)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleValueDragOver(e, group.id, index)}
                        className={cn(
                          'px-3.5 py-1.5 rounded-full text-sm border cursor-grab active:cursor-grabbing transition-all inline-flex items-center gap-1',
                          isDefiner ? 'font-bold' : 'font-medium',
                          SELECTED_COLORS[group.color],
                          draggedValue === value && 'opacity-40 scale-95',
                          dropPosition?.groupId === group.id && dropPosition?.index === index && draggedValue !== value
                            && 'ring-2 ring-life-energy ring-offset-2 ring-offset-background'
                        )}
                      >
                        {value}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Remove from themeGroups
                            setThemeGroups(prev => {
                              if (!prev) return prev;
                              const updated = prev.map(g => ({
                                ...g,
                                values: g.values.filter(v => v !== value),
                              })).filter(g => g.values.length > 0);
                              return updated;
                            });
                            // Remove from selectedValues
                            setSelectedValues(prev => prev.filter(v => v !== value));
                          }}
                          className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                          title="Remove value"
                        >
                          ×
                        </button>
                      </motion.span>
                    );
                  })}
                  {group.values.length > 1 && (
                    <span className="text-[10px] text-muted-foreground/50 ml-auto select-none">
                      most → least important
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="bg-muted/30 rounded-xl p-6 space-y-3">
              <p className="text-sm font-medium text-foreground">Tips:</p>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>• The <strong>first value</strong> in each row defines the theme</li>
                <li>• Order values left → right by importance</li>
                <li>• Drag values between rows to regroup them</li>
              </ul>
            </div>
            <Button onClick={() => completeStep(3)} className="bg-life-energy hover:bg-life-energy/90 text-primary-foreground">
              Step 3 Complete <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const [step4Picks, setStep4Picks] = useState<string[]>([]);
  const [step4Unpicked, setStep4Unpicked] = useState<string[]>([]);

  const toggleStep4Pick = (value: string) => {
    setStep4Picks(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const renderStep4 = () => {
    const unpicked = selectedValues.filter(v => !step4Picks.includes(v));
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-8 pb-8">
          <div className="max-w-xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-foreground">Narrow to Your Top 5–10</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Select the values that are truly essential. You currently have <strong>{selectedValues.length}</strong> values — pick the 5–10 that matter most.
            </p>
            <div className="bg-muted/30 rounded-xl p-6 space-y-3">
              <p className="text-sm font-medium text-foreground">For each value, ask:</p>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>• Is this value essential to my life?</li>
                <li>• Does this represent my primary way of being?</li>
                <li>• Is this essential to supporting my inner self?</li>
                <li>• Would I feel incomplete without this value?</li>
              </ul>
            </div>

            {step4Picks.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Your Top Values ({step4Picks.length})</p>
                <div className="flex flex-wrap gap-2 bg-primary/5 border border-primary/20 rounded-xl p-4">
                  {step4Picks.map(value => {
                    const category = getCategoryForValue(value);
                    return (
                      <motion.button
                        key={value}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleStep4Pick(value)}
                        className={cn('px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-all shadow-md ring-2 ring-primary/40', SELECTED_COLORS[category])}
                      >
                        {value} ✓
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Click values to add them to your top picks:</p>
              <div className="flex flex-wrap gap-2">
                {unpicked.map(value => {
                  const category = getCategoryForValue(value);
                  return (
                    <motion.button
                      key={value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleStep4Pick(value)}
                      className={cn('px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-all opacity-60 hover:opacity-100', SELECTED_COLORS[category])}
                    >
                      {value}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {step4Picks.length >= 5 && step4Picks.length <= 10
                ? `✓ You have ${step4Picks.length} top values — great range!`
                : step4Picks.length > 10
                  ? `You have ${step4Picks.length} — try to get to 10 or fewer.`
                  : `Select at least 5 values to continue (${step4Picks.length}/5).`}
            </p>
            <Button
              onClick={() => {
                const unpickedValues = selectedValues.filter(v => !step4Picks.includes(v));
                setStep4Unpicked(unpickedValues);
                setSelectedValues(step4Picks);
                completeStep(4);
              }}
              disabled={step4Picks.length < 5}
              className="bg-life-energy hover:bg-life-energy/90 text-primary-foreground"
            >
              Step 4 Complete <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStep5 = () => (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="pt-8 pb-8">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-xl font-bold text-foreground">Craft Values Statements</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Turn each of your core values into a short, memorable phrase that captures what it means to you personally. This makes your values actionable and uniquely yours.
          </p>
          <div className="bg-muted/30 rounded-xl p-6 space-y-3">
            <p className="text-sm font-medium text-foreground">Examples:</p>
            <ul className="text-sm text-muted-foreground space-y-1.5 italic">
              <li>• Health: "To live with full vitality and energy every day."</li>
              <li>• Creativity: "To approach life with curiosity and original thinking."</li>
              <li>• Integrity: "To be honest and transparent in every interaction."</li>
            </ul>
          </div>
          <div className="space-y-4">
            {selectedValues.map(value => {
              const category = getCategoryForValue(value);
              return (
                <div key={value} className="flex items-start gap-3">
                  <span className={cn('px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap mt-2', SELECTED_COLORS[category])}>
                    {value}
                  </span>
                  <Textarea
                    value={valuesStatements[value] || ''}
                    onChange={(e) => setValuesStatements(prev => ({ ...prev, [value]: e.target.value }))}
                    placeholder={`What does ${value} mean to you? e.g. "To live with..."`}
                    className="flex-1 min-h-[60px] text-sm resize-none"
                    rows={2}
                  />
                </div>
              );
            })}
          </div>
          <Button onClick={() => completeStep(5)} className="bg-life-energy hover:bg-life-energy/90 text-primary-foreground">
            Step 5 Complete <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep6 = () => (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="pt-8 pb-8">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 mx-auto rounded-full bg-life-energy/20 flex items-center justify-center"
          >
            <Moon className="w-10 h-10 text-life-energy" />
          </motion.div>
          <h2 className="text-xl font-bold text-foreground">Gut Check</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Sleep on it. Come back tomorrow and review your list with fresh eyes. Your values should feel deeply personal and authentic — not what others expect of you.
          </p>
          <div className="bg-muted/30 rounded-xl p-6 text-left space-y-3">
            <p className="text-sm font-medium text-foreground">Check these:</p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li>• Do these values feel consistent with who I am?</li>
              <li>• Are these truly mine, not borrowed from others?</li>
              <li>• Would I stand by these in difficult times?</li>
              <li>• Do they make me feel grounded and centered?</li>
            </ul>
          </div>
          <Button onClick={() => completeStep(6)} className="bg-life-energy hover:bg-life-energy/90 text-primary-foreground">
            Step 6 Complete <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep7 = () => (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="pt-8 pb-8">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 mx-auto rounded-full bg-life-energy/20 flex items-center justify-center"
          >
            <ShieldCheck className="w-10 h-10 text-life-energy" />
          </motion.div>
          <h2 className="text-xl font-bold text-foreground">Live Your Values</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your core values are not just words — they are a compass. Use them to guide your daily decisions, set priorities, and align your time with what truly matters.
          </p>
          <div className="bg-muted/30 rounded-xl p-6 text-left space-y-3">
            <p className="text-sm font-medium text-foreground">Your Final Core Values:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedValues.map(value => {
                const category = getCategoryForValue(value);
                return (
                  <span key={value} className={cn('px-3 py-1.5 rounded-full text-sm font-medium border shadow-md', SELECTED_COLORS[category])}>
                    {value}
                  </span>
                );
              })}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Review these regularly. Let them shape your goals, habits, and how you spend your time.
          </p>
          {!completedSteps.includes(7) && (
            <Button onClick={() => completeStep(7)} className="bg-life-energy hover:bg-life-energy/90 text-primary-foreground">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Journey Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const [selectedVirtues, setSelectedVirtues] = useState<string[]>([]);

  const toggleVirtue = (virtue: string) => {
    setSelectedVirtues(prev =>
      prev.includes(virtue) ? prev.filter(v => v !== virtue) : [...prev, virtue]
    );
  };

  const renderStep8 = () => {
    const allVirtuesCandidates = new Set<string>();
    step4Unpicked.forEach(v => allVirtuesCandidates.add(v));
    VIRTUES_LIST.forEach(v => allVirtuesCandidates.add(v));
    selectedValues.forEach(v => allVirtuesCandidates.delete(v));
    const virtuesList = Array.from(allVirtuesCandidates).sort();

    const fromShortlist = virtuesList.filter(v => step4Unpicked.includes(v));
    const additional = virtuesList.filter(v => !step4Unpicked.includes(v));

    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-8 pb-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-foreground">Virtues to Study & Practice</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Like Benjamin Franklin's 13 virtues, select the virtues you'd like to study and cultivate. These complement your core values — qualities you admire and want to develop further.
            </p>

            {selectedVirtues.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Your Virtues ({selectedVirtues.length})</p>
                <div className="flex flex-wrap gap-2 bg-primary/5 border border-primary/20 rounded-xl p-4">
                  {selectedVirtues.map(virtue => (
                    <motion.button
                      key={virtue}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleVirtue(virtue)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-all shadow-md bg-life-energy text-primary-foreground border-life-energy/80 ring-2 ring-life-energy/40"
                    >
                      {virtue} ✓
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {fromShortlist.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">From your earlier shortlist:</p>
                <div className="flex flex-wrap gap-2">
                  {fromShortlist.filter(v => !selectedVirtues.includes(v)).map(virtue => {
                    const category = getCategoryForValue(virtue);
                    return (
                      <motion.button
                        key={virtue}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleVirtue(virtue)}
                        className={cn('px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-all opacity-70 hover:opacity-100', SELECTED_COLORS[category] || 'bg-muted border-muted-foreground/30 text-foreground')}
                      >
                        {virtue}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Additional virtues:</p>
              <div className="flex flex-wrap gap-2">
                {additional.filter(v => !selectedVirtues.includes(v)).map(virtue => (
                  <motion.button
                    key={virtue}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleVirtue(virtue)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-all opacity-60 hover:opacity-100 bg-muted/50 border-muted-foreground/30 text-foreground hover:bg-muted"
                  >
                    {virtue}
                  </motion.button>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic">
              Inspired by <a href="https://www.virtuesforlife.com/virtues-list/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Virtues for Life</a> and Benjamin Franklin's practice of studying one virtue per week.
            </p>

            {selectedVirtues.length >= 1 && (
              <Button onClick={() => completeStep(8)} className="bg-life-energy hover:bg-life-energy/90 text-primary-foreground">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Complete Virtues Selection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const stepRenderers: Record<number, () => JSX.Element> = {
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
    5: renderStep5,
    6: renderStep6,
    7: renderStep7,
    8: renderStep8,
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-life-energy">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Core Values</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              An 8-step journey to discover what matters most to you.
              <span className="ml-2 text-xs italic">
                Based on <a href="https://scottjeffrey.com/personal-core-values/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Scott Jeffrey's framework</a>
              </span>
            </p>
          </div>

          {/* Step Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center gap-1">
              {STEPS.map((step, i) => {
                const isCompleted = completedSteps.includes(step.number);
                const isCurrent = currentStep === step.number;
                const isAccessible = step.number <= Math.max(...completedSteps, 0) + 1;
                const StepIcon = step.icon;

                return (
                  <div key={step.number} className="flex items-center flex-1">
                    <button
                      onClick={() => isAccessible && goToStep(step.number)}
                      disabled={!isAccessible}
                      className={cn(
                        'flex flex-col items-center gap-1 w-full group transition-all',
                        isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                      )}
                    >
                      <div className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center transition-all border-2',
                        isCompleted
                          ? 'bg-life-energy border-life-energy text-primary-foreground'
                          : isCurrent
                            ? 'border-life-energy text-life-energy bg-life-energy/10'
                            : 'border-muted-foreground/30 text-muted-foreground'
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-4 h-4" />
                        )}
                      </div>
                      <span className={cn(
                        'text-[10px] font-medium text-center leading-tight hidden md:block',
                        isCurrent ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {step.title}
                      </span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div className={cn(
                        'h-0.5 flex-1 mx-1 rounded-full transition-colors',
                        isCompleted ? 'bg-life-energy' : 'bg-muted-foreground/20'
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {journeyComplete ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="border-life-energy/30 bg-card/50">
                <CardContent className="pt-6 text-center space-y-4">
                  <CheckCircle2 className="w-16 h-16 text-life-energy mx-auto" />
                  <h2 className="text-2xl font-bold text-foreground">Your Core Values</h2>
                  <p className="text-muted-foreground max-w-lg mx-auto">
                    These are the values and virtues guiding your life.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Button variant="outline" onClick={() => { setJourneyComplete(false); setCurrentStep(8); }}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Review Virtues
                    </Button>
                    <Button variant="outline" onClick={() => { setJourneyComplete(false); setCurrentStep(5); }}>
                      <PenLine className="w-4 h-4 mr-2" /> Edit Statements
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Core Values with Statements */}
              <Card className="border-border/50 bg-card/50">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Heart className="w-4 h-4 text-life-energy" /> Core Values & Statements</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {selectedValues.map(v => {
                    const vc = valuesColors[v];
                    return (
                      <div key={v} className="flex items-start gap-3 group">
                        <div className="relative mt-0.5 shrink-0">
                          <button
                            onClick={() => setColorPickerOpen(colorPickerOpen === v ? null : v)}
                            className="h-4 w-4 rounded-full border border-border/50 hover:scale-125 transition-transform cursor-pointer flex items-center justify-center"
                            style={{ backgroundColor: vc || 'hsl(var(--life-energy))' }}
                            title="Change color"
                          >
                            <Palette className="w-2.5 h-2.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          {colorPickerOpen === v && (
                            <div ref={colorPickerRef} className="absolute left-6 top-0 z-50 bg-popover border border-border rounded-lg p-2 shadow-lg">
                              <div className="grid grid-cols-6 gap-1.5 w-fit">
                                {VALUE_COLOR_PRESETS.map((color) => (
                                  <button
                                    key={color}
                                    onClick={() => updateValueColor(v, color)}
                                    className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110"
                                    style={{
                                      backgroundColor: color,
                                      borderColor: valuesColors[v] === color ? 'hsl(var(--foreground))' : 'transparent',
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-semibold" style={{ color: vc || 'hsl(var(--foreground))' }}>{v}</span>
                          {valuesStatements[v] ? (
                            <p className="text-sm mt-0.5 italic" style={{ color: vc ? `${vc}99` : 'hsl(var(--muted-foreground))' }}>"{valuesStatements[v]}"</p>
                          ) : (
                            <p className="text-xs text-muted-foreground/50 mt-0.5">No statement written yet</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Virtues to Study */}
              {selectedVirtues.length > 0 && (
                <Card className="border-border/50 bg-card/50">
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-life-energy" /> Virtues to Study</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {selectedVirtues.map(v => (
                      <Badge key={v} variant="outline">{v}</Badge>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Reset Option */}
              <Card className="border-destructive/20 bg-card/50">
                <CardContent className="pt-6">
                  {resetConfirmStep === 0 && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Start Over</p>
                        <p className="text-xs text-muted-foreground">Reset and redo the entire core values discovery process.</p>
                      </div>
                      <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setResetConfirmStep(1)}>
                        Reset Journey
                      </Button>
                    </div>
                  )}
                  {resetConfirmStep === 1 && (
                    <div className="text-center space-y-3">
                      <p className="text-sm font-medium text-destructive">Are you sure? This will erase all your selections and statements.</p>
                      <div className="flex gap-3 justify-center">
                        <Button variant="outline" size="sm" onClick={() => setResetConfirmStep(0)}>Cancel</Button>
                        <Button variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => setResetConfirmStep(2)}>
                          Yes, I'm sure
                        </Button>
                      </div>
                    </div>
                  )}
                  {resetConfirmStep === 2 && (
                    <div className="text-center space-y-3">
                      <p className="text-sm font-bold text-destructive">Final confirmation — this cannot be undone.</p>
                      <div className="flex gap-3 justify-center">
                        <Button variant="outline" size="sm" onClick={() => setResetConfirmStep(0)}>Cancel</Button>
                        <Button size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => {
                          setSelectedValues([]);
                          setCustomValues({});
                          setValuesStatements({});
                          setValuesColors({});
                          setCompletedSteps([]);
                          setCurrentStep(1);
                          setJourneyComplete(false);
                          setThemeGroups(null);
                          setBeginnerReady(false);
                          setResetConfirmStep(0);
                          localStorage.removeItem('core-values-step');
                          localStorage.removeItem('core-values-completed-steps');
                          localStorage.removeItem('core-values-colors');
                          toast.success('Journey reset. Starting fresh!');
                        }}>
                          Reset Everything
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <>
              {/* Current Step Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {currentStep > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => { if (currentStep === 3) setThemeGroups(null); setCurrentStep(currentStep - 1); }}>
                      <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                  )}
                  <h2 className="text-lg font-semibold text-foreground">
                    Step {currentStep}: {STEPS[currentStep - 1].title}
                  </h2>
                </div>
                <span className="text-xs text-muted-foreground">{STEPS[currentStep - 1].subtitle}</span>
              </div>

              {/* Step Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {stepRenderers[currentStep]()}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default CoreValues;
