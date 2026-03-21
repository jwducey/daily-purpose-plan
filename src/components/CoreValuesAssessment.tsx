import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, X, ChevronRight, ChevronLeft, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, lastDayOfMonth, isToday, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface AssessmentScore {
  [value: string]: number;
}

interface AssessmentRecord {
  assessment_date: string;
  scores: AssessmentScore;
  notes: string | null;
}

interface CoreValuesAssessmentProps {
  forceOpen?: boolean;
  onForceOpenHandled?: () => void;
  providedValues?: string[];
}

export function CoreValuesAssessment({ forceOpen, onForceOpenHandled, providedValues }: CoreValuesAssessmentProps = {}) {
  const { user } = useAuth();
  const [coreValues, setCoreValues] = useState<string[]>([]);
  const [valuesColors, setValuesColors] = useState<Record<string, string>>({});
  const [valuesStatements, setValuesStatements] = useState<Record<string, string>>({});
  const [showAssessment, setShowAssessment] = useState(false);
  const [scores, setScores] = useState<AssessmentScore>({});
  const [actions, setActions] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [currentValueIdx, setCurrentValueIdx] = useState(0);
  const [history, setHistory] = useState<AssessmentRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const today = new Date();
  const isLastDayOfMonth = isToday(lastDayOfMonth(today));
  const currentMonth = format(today, 'yyyy-MM-dd');

  // Load core values and check if assessment is needed
  useEffect(() => {
    const load = async () => {
      // Load colors
      const savedColors = localStorage.getItem('core-values-colors');
      if (savedColors) setValuesColors(JSON.parse(savedColors));

      // Check dismissal for today
      const dismissedDate = localStorage.getItem('assessment-dismissed-date');
      if (dismissedDate === format(today, 'yyyy-MM-dd')) {
        setDismissed(true);
      }

      let values: string[] = providedValues || [];

      if (!providedValues?.length && user) {
        // Load values from DB
        const { data } = await supabase
          .from('core_values_shortlist')
          .select('selected_values')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data?.selected_values?.length) {
          values = data.selected_values;
        }

        // Check if already completed this month
        const lastDay = format(lastDayOfMonth(today), 'yyyy-MM-dd');
        const { data: existing } = await supabase
          .from('core_values_assessments')
          .select('*')
          .eq('user_id', user.id)
          .eq('assessment_date', lastDay)
          .maybeSingle();
        if (existing) {
          setAlreadyCompleted(true);
        }

        // Load history
        const { data: historyData } = await supabase
          .from('core_values_assessments')
          .select('assessment_date, scores, notes')
          .eq('user_id', user.id)
          .order('assessment_date', { ascending: false })
          .limit(12);
        if (historyData) {
          setHistory(historyData.map(h => ({
            assessment_date: h.assessment_date,
            scores: h.scores as unknown as AssessmentScore,
            notes: h.notes,
          })));
        }
      } else if (!providedValues?.length) {
        const saved = localStorage.getItem('core-values-shortlist');
        if (saved) values = JSON.parse(saved);
      }

      setCoreValues(values);

      // Initialize scores
      const initial: AssessmentScore = {};
      values.forEach(v => { initial[v] = 5; });
      setScores(initial);
    };
    load();
  }, [user]);

  // Auto-show on last day of month OR when force-opened (journey just completed)
  useEffect(() => {
    if (forceOpen && coreValues.length > 0 && !showAssessment) {
      setShowAssessment(true);
      onForceOpenHandled?.();
      return;
    }
    if (isLastDayOfMonth && coreValues.length > 0 && !alreadyCompleted && !dismissed) {
      const timer = setTimeout(() => setShowAssessment(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLastDayOfMonth, coreValues, alreadyCompleted, dismissed, forceOpen]);

  const handleSave = async () => {
    const assessmentDate = format(lastDayOfMonth(today), 'yyyy-MM-dd');

    if (user) {
      const { error } = await supabase
        .from('core_values_assessments')
        .upsert({
          user_id: user.id,
          assessment_date: assessmentDate,
          scores: scores as any,
          notes: notes || null,
        } as any, { onConflict: 'user_id,assessment_date' });

      if (error) {
        console.error('Failed to save assessment:', error);
        toast.error('Failed to save assessment');
        return;
      }
    }

    // Also save to localStorage as backup
    const localHistory = JSON.parse(localStorage.getItem('core-values-assessment-history') || '[]');
    localHistory.unshift({ assessment_date: assessmentDate, scores, notes });
    localStorage.setItem('core-values-assessment-history', JSON.stringify(localHistory.slice(0, 12)));

    setAlreadyCompleted(true);
    setShowAssessment(false);
    toast.success('Assessment saved! Review your progress anytime on the Values page.');
  };

  const handleDismiss = () => {
    localStorage.setItem('assessment-dismissed-date', format(today, 'yyyy-MM-dd'));
    setDismissed(true);
    setShowAssessment(false);
  };

  const avgScore = coreValues.length > 0
    ? (Object.values(scores).reduce((a, b) => a + b, 0) / coreValues.length).toFixed(1)
    : '0';

  // Public method to manually open
  const openAssessment = () => {
    if (coreValues.length === 0) {
      toast.error('Complete the Core Values journey first');
      return;
    }
    setCurrentValueIdx(0);
    setShowAssessment(true);
  };

  return (
    <>
      {/* Trigger button for Dashboard/Values page */}
      {coreValues.length > 0 && (
        <AssessmentTrigger
          isLastDay={isLastDayOfMonth}
          alreadyCompleted={alreadyCompleted}
          history={history}
          onOpen={openAssessment}
          onShowHistory={() => setShowHistory(true)}
        />
      )}

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-serif flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-life-energy" />
                  Assessment History
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No assessments recorded yet.</p>
              ) : (
                <div className="space-y-6">
                  {history.map((record) => (
                    <div key={record.assessment_date} className="p-4 rounded-xl bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {format(parseISO(record.assessment_date), 'MMMM yyyy')}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          Avg: {(Object.values(record.scores).reduce((a, b) => a + b, 0) / Math.max(Object.keys(record.scores).length, 1)).toFixed(1)}/10
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(record.scores).map(([value, score]) => (
                          <div key={value} className="flex items-center justify-between text-sm">
                            <span className="truncate" style={{ color: valuesColors[value] || 'hsl(var(--foreground))' }}>
                              {value}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${(score / 10) * 100}%`,
                                    backgroundColor: valuesColors[value] || 'hsl(var(--life-energy))',
                                  }}
                                />
                              </div>
                              <span className="font-mono text-xs w-4 text-right">{score}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {record.notes && (
                        <p className="text-xs text-muted-foreground mt-3 italic border-t border-border/30 pt-2">
                          {record.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assessment Overlay */}
      <AnimatePresence>
        {showAssessment && coreValues.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-life-energy" />
                <h2 className="text-lg font-serif">Monthly Values Assessment</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                <X className="w-4 h-4 mr-1" /> Dismiss
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto p-6 space-y-8">
                {/* Intro */}
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                    From a centered state, assess how well you're honoring each value by scoring it on a scale of 1 to 10,
                    where 10 represents optimally living the value.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(today, 'MMMM d, yyyy')} — Monthly Check-In
                  </p>
                </div>

                {/* All values rating */}
                <div className="space-y-6">
                  {coreValues.map((value, idx) => {
                    const vc = valuesColors[value];
                    return (
                      <motion.div
                        key={value}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-4 rounded-xl bg-card border border-border/50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-muted-foreground/50">#{idx + 1}</span>
                            <span className="font-medium" style={{ color: vc || 'hsl(var(--foreground))' }}>
                              {value}
                            </span>
                          </div>
                          <span
                            className="text-2xl font-bold font-mono"
                            style={{ color: vc || 'hsl(var(--life-energy))' }}
                          >
                            {scores[value] || 5}
                          </span>
                        </div>
                        <Slider
                          value={[scores[value] || 5]}
                          min={1}
                          max={10}
                          step={1}
                          trackColor={vc || undefined}
                          onValueChange={(vals) => setScores(prev => ({ ...prev, [value]: vals[0] }))}
                        />
                        <div className="flex justify-between mt-1">
                          <span className="text-[10px] text-muted-foreground">Not living it</span>
                          <span className="text-[10px] text-muted-foreground">Fully embodying</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reflections (optional)</label>
                  <Textarea
                    placeholder="Any thoughts on your current alignment with your values..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Summary */}
                <Card className="border-life-energy/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Average</span>
                      <span className="text-3xl font-bold font-mono text-life-energy">{avgScore}<span className="text-sm text-muted-foreground">/10</span></span>
                    </div>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-life-energy rounded-full transition-all duration-300"
                        style={{ width: `${(parseFloat(avgScore) / 10) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-3 justify-center pb-8">
                  <Button variant="outline" onClick={handleDismiss}>
                    Remind Me Later
                  </Button>
                  <Button onClick={handleSave} className="bg-life-energy hover:bg-life-energy/90 text-white">
                    Save Assessment
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Small widget to embed in Dashboard
function AssessmentTrigger({
  isLastDay,
  alreadyCompleted,
  history,
  onOpen,
  onShowHistory,
}: {
  isLastDay: boolean;
  alreadyCompleted: boolean;
  history: AssessmentRecord[];
  onOpen: () => void;
  onShowHistory: () => void;
}) {
  const lastAssessment = history[0];

  return (
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
      {isLastDay && !alreadyCompleted ? (
        <Button size="sm" onClick={onOpen} className="bg-life-energy hover:bg-life-energy/90 text-white w-full">
          <Heart className="w-4 h-4 mr-2" />
          Monthly Values Check-In
        </Button>
      ) : (
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-muted-foreground">
            {lastAssessment ? (
              <>Last assessed: {format(parseISO(lastAssessment.assessment_date), 'MMM yyyy')} — Avg: {(Object.values(lastAssessment.scores).reduce((a, b) => a + b, 0) / Math.max(Object.keys(lastAssessment.scores).length, 1)).toFixed(1)}/10</>
            ) : (
              'No assessments yet'
            )}
          </div>
          <div className="flex gap-1">
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onShowHistory} className="text-xs h-7">
                <TrendingUp className="w-3 h-3 mr-1" /> History
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onOpen} className="text-xs h-7">
              Assess Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
