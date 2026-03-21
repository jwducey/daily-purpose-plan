import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Heart, ChevronDown, ChevronUp, Info, CheckCircle2, ArrowRight, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

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

const INSTRUCTIONS_STEPS = [
  {
    title: 'Step 1: Start with a Beginner\'s Mind',
    content: 'Let go of all preconceived notions. Take a deep breath and empty your mind. Create space for new insights to emerge from within yourself.',
  },
  {
    title: 'Step 2: Select Values That Resonate',
    content: 'Scan the values below by category. Click on any value that resonates with you — don\'t overthink it. Select all that feel important to create your initial shortlist.',
  },
  {
    title: 'Step 3: Group & Refine',
    content: 'After selecting your initial values, you\'ll group them into related themes and highlight the central theme of each grouping.',
  },
  {
    title: 'Step 4: Narrow to Your Top 5-10',
    content: 'Ask yourself: What values are essential to my life? What represents my primary way of being? What\'s essential to supporting my inner self?',
  },
  {
    title: 'Step 5: Craft Values Statements',
    content: 'Turn each value into a memorable phrase. For example: "Health: to live with full vitality and energy every day."',
  },
  {
    title: 'Step 6: Gut Check',
    content: 'Sleep on it. Review your list the next day. Do they feel consistent with who you are? Are they truly personal to you?',
  },
];

const CoreValues = () => {
  const [selectedValues, setSelectedValues] = useState<string[]>(() => {
    const saved = localStorage.getItem('core-values-shortlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [customValues, setCustomValues] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('core-values-custom');
    return saved ? JSON.parse(saved) : {};
  });
  const [showInstructions, setShowInstructions] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    Object.keys(CORE_VALUES_BY_CATEGORY).forEach(cat => initial[cat] = true);
    return initial;
  });
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newValueText, setNewValueText] = useState('');

  useEffect(() => {
    localStorage.setItem('core-values-shortlist', JSON.stringify(selectedValues));
  }, [selectedValues]);

  useEffect(() => {
    localStorage.setItem('core-values-custom', JSON.stringify(customValues));
  }, [customValues]);

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
    const allValues = [...Object.values(CORE_VALUES_BY_CATEGORY).flat(), ...Object.values(customValues).flat()];
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
    for (const [cat, vals] of Object.entries(CORE_VALUES_BY_CATEGORY)) {
      if (vals.includes(value)) return cat;
    }
    for (const [cat, vals] of Object.entries(customValues)) {
      if (vals.includes(value)) return cat;
    }
    return 'Integrity';
  };

  const totalValues = Object.values(CORE_VALUES_BY_CATEGORY).flat().length + Object.values(customValues).flat().length;

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
              Discover what matters most to you. Select values that resonate to build your personal shortlist.
            </p>
          </div>

          {/* Selection Counter */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm px-3 py-1.5 border-life-energy/50 text-life-energy">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {selectedValues.length} selected
              </Badge>
              <span className="text-xs text-muted-foreground">out of {totalValues} values</span>
            </div>
            {selectedValues.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedValues([])}
                className="text-muted-foreground hover:text-destructive"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Instructions Accordion */}
          <Card className="mb-8 border-border/50 bg-card/50">
            <CardHeader
              className="cursor-pointer select-none"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-muted-foreground" />
                  <CardTitle className="text-base">How to Discover Your Core Values</CardTitle>
                </div>
                {showInstructions ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Based on Scott Jeffrey's 7-Step Discovery Process
              </p>
            </CardHeader>
            <AnimatePresence>
              {showInstructions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {INSTRUCTIONS_STEPS.map((step, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-life-energy/20 text-life-energy flex items-center justify-center text-sm font-bold">
                            {i + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{step.title}</h4>
                            <p className="text-sm text-muted-foreground mt-0.5">{step.content}</p>
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground italic mt-4">
                        Source: <a href="https://scottjeffrey.com/personal-core-values/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">scottjeffrey.com/personal-core-values</a>
                      </p>
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Selected Values Summary */}
          {selectedValues.length > 0 && (
            <Card className="mb-8 border-life-energy/30 bg-life-energy/5">
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
              const selectedInCategory = values.filter(v => selectedValues.includes(v)).length;
              const isExpanded = expandedCategories[category];

              return (
                <Card key={category} className="border-border/50 bg-card/50 overflow-hidden">
                  <CardHeader
                    className="cursor-pointer select-none py-4"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base">{category}</CardTitle>
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
                            {/* Add custom value */}
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
        </div>
      </main>
    </div>
  );
};

export default CoreValues;
