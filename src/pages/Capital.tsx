import { Navigation } from '@/components/Navigation';
import { motion } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';
import { useTimeRemaining } from '@/hooks/useTimeRemaining';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
import { SocialCapitalScorer } from '@/components/SocialCapitalScorer';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useCallback } from 'react';

const CAPITAL_FORMS = [
  { id: 'financial', name: 'Financial Capital', icon: '💰', description: 'Cash, savings, equity, debt (negative).', valueLabel: 'Currency ($)' },
  { id: 'intellectual', name: 'Intellectual Capital', icon: '🧠', description: 'Degrees, certifications, "how-to" knowledge.', valueLabel: 'Utility / Scarcity' },
  { id: 'social', name: 'Social Capital', icon: '🤝', description: 'Contact list, mentors, community memberships.', valueLabel: 'Trust / Reach' },
  { id: 'material', name: 'Material Capital', icon: '🏗️', description: 'Tools, laptop, home, car, solar panels.', valueLabel: 'Replacement Cost / Hours Saved' },
  { id: 'natural', name: 'Living Capital', icon: '🌿', description: 'Physical health, clean water access, soil quality.', valueLabel: 'Vitality / Resilience' },
  { id: 'cultural', name: 'Cultural Capital', icon: '🎭', description: 'Language skills, shared rituals, brand identity.', valueLabel: 'Belonging / Influence' },
  { id: 'spiritual', name: 'Spiritual Capital', icon: '✨', description: 'Meditation practice, sense of purpose, integrity.', valueLabel: 'Peace / Alignment (0–10)' },
  { id: 'experiential', name: 'Experiential Capital', icon: '🎯', description: 'Years of practice, "failure scars," mastery.', valueLabel: 'Competence' },
];

export default function Capital() {
  const { user, capitalRatings, setCapitalRating, capitalAssets, addCapitalAsset, updateCapitalAsset, removeCapitalAsset, socialRelationships, addSocialRelationship, updateSocialRelationship, removeSocialRelationship, financialConfig, setFinancialConfig } = useUser();

  const birthDate = user?.birthDate || new Date(new Date().getFullYear() - 30, 0, 1);
  const expectedLifespan = user?.expectedLifespan || 80;
  const lifeRemaining = useTimeRemaining(birthDate, expectedLifespan);
  const yearsRemaining = lifeRemaining.years;

  // Auto-calculate financial capital rating
  const financialRating = useMemo(() => {
    const totalAssets = capitalAssets
      .filter(a => a.capitalId === 'financial')
      .reduce((sum, a) => {
        const num = parseFloat(a.value.replace(/[^0-9.-]/g, ''));
        return sum + (isNaN(num) ? 0 : num);
      }, 0);

    const { yearlyExpenses, yearlyROI } = financialConfig;
    if (yearlyExpenses <= 0 || yearsRemaining <= 0) return 0;

    // How many years can assets sustain? (accounting for ROI)
    // With ROI: assets grow each year, so we simulate year by year
    let remaining = totalAssets;
    let yearsSustained = 0;
    const roiRate = (yearlyROI || 0) / 100;

    for (let i = 0; i < yearsRemaining && remaining > 0; i++) {
      remaining = remaining * (1 + roiRate) - yearlyExpenses;
      if (remaining >= 0) yearsSustained++;
      else break;
    }

    // If sustained >= yearsRemaining, they're financially independent = 10
    const ratio = Math.min(yearsSustained / yearsRemaining, 1);
    return Math.max(1, Math.round(ratio * 10)) || 0;
  }, [capitalAssets, financialConfig, yearsRemaining]);

  // Sync auto-calculated financial rating
  useEffect(() => {
    if (financialConfig.yearlyExpenses > 0 && financialRating > 0) {
      setCapitalRating('financial', financialRating);
    }
  }, [financialRating, financialConfig.yearlyExpenses, setCapitalRating]);

  const totalScore = CAPITAL_FORMS.reduce((sum, form) => sum + (capitalRatings[form.id] || 0), 0);
  const maxScore = CAPITAL_FORMS.length * 10;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <Navigation />
      
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-8">
          <motion.header 
            className="space-y-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl md:text-3xl font-serif">Capital</h1>
            <p className="text-muted-foreground text-sm">
              Rate your eight forms of capital and track your assets.
            </p>
          </motion.header>

          {/* Radar Chart */}
          <motion.div
            className="rounded-2xl border border-border bg-card p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-2/3 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={CAPITAL_FORMS.map(f => ({ name: f.icon + ' ' + f.name.replace(' Capital', ''), value: capitalRatings[f.id] || 0, fullMark: 10 }))}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Radar name="Capital" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center md:text-left">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Holistic Wealth Score</p>
                <p className="text-5xl font-serif font-bold text-foreground">{totalScore}</p>
                <p className="text-sm text-muted-foreground mt-1">out of {maxScore}</p>
              </div>
            </div>
          </motion.div>

          {/* Capital Forms */}
          <div className="space-y-4">
            {CAPITAL_FORMS.map((form, index) => (
              <CapitalFormCard
                key={form.id}
                form={form}
                index={index}
                rating={capitalRatings[form.id] || 0}
                onRate={(num) => setCapitalRating(form.id, num)}
                assets={capitalAssets.filter(a => a.capitalId === form.id)}
                onAddAsset={(name, value) => addCapitalAsset(form.id, name, value)}
                onUpdateAsset={updateCapitalAsset}
                onRemoveAsset={removeCapitalAsset}
                isSocial={form.id === 'social'}
                isFinancial={form.id === 'financial'}
                socialRelationships={socialRelationships}
                onAddRelationship={addSocialRelationship}
                onUpdateRelationship={updateSocialRelationship}
                onRemoveRelationship={removeSocialRelationship}
                financialConfig={financialConfig}
                onFinancialConfigChange={setFinancialConfig}
                yearsRemaining={yearsRemaining}
                financialRating={financialRating}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

interface CapitalFormCardProps {
  form: typeof CAPITAL_FORMS[number];
  index: number;
  rating: number;
  onRate: (num: number) => void;
  assets: { id: string; name: string; value: string }[];
  onAddAsset: (name: string, value: string) => void;
  onUpdateAsset: (id: string, updates: { name?: string; value?: string }) => void;
  onRemoveAsset: (id: string) => void;
  isSocial?: boolean;
  isFinancial?: boolean;
  socialRelationships?: import('@/components/SocialCapitalScorer').SocialRelationship[];
  onAddRelationship?: (name: string) => void;
  onUpdateRelationship?: (id: string, updates: Partial<Omit<import('@/components/SocialCapitalScorer').SocialRelationship, 'id'>>) => void;
  onRemoveRelationship?: (id: string) => void;
  financialConfig?: { yearlyExpenses: number; yearlyROI: number };
  onFinancialConfigChange?: (config: { yearlyExpenses?: number; yearlyROI?: number }) => void;
  yearsRemaining?: number;
  financialRating?: number;
}

function CapitalFormCard({ form, index, rating, onRate, assets, onAddAsset, onUpdateAsset, onRemoveAsset, isSocial, isFinancial, socialRelationships, onAddRelationship, onUpdateRelationship, onRemoveRelationship, financialConfig, onFinancialConfigChange, yearsRemaining, financialRating }: CapitalFormCardProps) {
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAddAsset(trimmed, newValue.trim());
    setNewName('');
    setNewValue('');
  };

  return (
    <motion.div
      className="rounded-2xl border border-border bg-card p-5 space-y-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.04 }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-2xl">{form.icon}</span>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-foreground">{form.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{form.description}</p>
        </div>
      </div>

      {/* Rating buttons */}
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
          const selected = rating === num;
          return (
            <button
              key={num}
              onClick={() => !isFinancial && onRate(num)}
              className={cn(
                'h-9 w-9 rounded-lg text-sm font-medium transition-all border',
                selected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-muted/50 text-muted-foreground border-border',
                isFinancial ? 'cursor-default' : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* Financial config */}
      {isFinancial && financialConfig && onFinancialConfigChange && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-semibold text-foreground">Financial Independence Calculator</p>
          <p className="text-xs text-muted-foreground">
            Rating auto-calculated: total assets ÷ yearly expenses (adjusted for ROI) vs. {yearsRemaining ?? '?'} years remaining.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Yearly Expenses ($)</label>
              <Input
                type="number"
                value={financialConfig.yearlyExpenses || ''}
                onChange={(e) => onFinancialConfigChange({ yearlyExpenses: parseFloat(e.target.value) || 0 })}
                className="h-8 text-sm"
                placeholder="e.g. 60000"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Avg. Yearly ROI (%)</label>
              <Input
                type="number"
                value={financialConfig.yearlyROI || ''}
                onChange={(e) => onFinancialConfigChange({ yearlyROI: parseFloat(e.target.value) || 0 })}
                className="h-8 text-sm"
                placeholder="e.g. 7"
              />
            </div>
          </div>
          {financialConfig.yearlyExpenses > 0 && (
            <p className="text-xs text-muted-foreground">
              Auto-rated: <span className="text-foreground font-bold">{financialRating}/10</span>
              {financialRating === 10 && ' — Financially Independent 🎉'}
            </p>
          )}
        </div>
      )}

      {/* Assets inventory */}
      <div className="space-y-2">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_1fr_36px] gap-2 px-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset</p>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{form.valueLabel}</p>
          <div />
        </div>

        {/* Existing assets */}
        {assets.map((asset) => (
          <div key={asset.id} className="grid grid-cols-[1fr_1fr_36px] gap-2 items-center">
            <Input
              value={asset.name}
              onChange={(e) => onUpdateAsset(asset.id, { name: e.target.value })}
              className="h-8 text-sm"
              placeholder="Asset name"
            />
            <Input
              value={asset.value}
              onChange={(e) => onUpdateAsset(asset.id, { value: e.target.value })}
              className="h-8 text-sm"
              placeholder="Value"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveAsset(asset.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}

        {/* Add new row */}
        <div className="grid grid-cols-[1fr_1fr_36px] gap-2 items-center">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-8 text-sm"
            placeholder="Add asset..."
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="h-8 text-sm"
            placeholder="Value"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={handleAdd}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isSocial && socialRelationships && onAddRelationship && onUpdateRelationship && onRemoveRelationship && (
        <SocialCapitalScorer
          relationships={socialRelationships}
          onAdd={onAddRelationship}
          onUpdate={onUpdateRelationship}
          onRemove={onRemoveRelationship}
        />
      )}
    </motion.div>
  );
}
