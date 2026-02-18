import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface SocialRelationship {
  id: string;
  name: string;
  reliability: number;
  vulnerability: number;
  resourceFlow: number;
  influence: number;
}

const DIMENSIONS = [
  {
    key: 'reliability' as const,
    label: 'Reliability',
    question: 'If your car broke down at 3 AM, would they pick up?',
    high: 'Instant action',
    low: '"Sorry, busy"',
  },
  {
    key: 'vulnerability' as const,
    label: 'Vulnerability',
    question: 'Can you tell them your biggest failure without judgment?',
    high: 'Emotional safety',
    low: 'Surface-level talk',
  },
  {
    key: 'resourceFlow' as const,
    label: 'Resource Flow',
    question: 'Do you share leads, tools, or advice freely?',
    high: 'Open exchange',
    low: 'Guarded/Hoarding',
  },
  {
    key: 'influence' as const,
    label: 'Influence',
    question: 'Does their recommendation carry weight in their circle?',
    high: 'Opens doors',
    low: 'No outside pull',
  },
];

function calcScore(r: SocialRelationship): number {
  return r.reliability + r.vulnerability + r.resourceFlow + r.influence;
}

interface Props {
  relationships: SocialRelationship[];
  onAdd: (name: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<SocialRelationship, 'id'>>) => void;
  onRemove: (id: string) => void;
}

export function SocialCapitalScorer({ relationships, onAdd, onUpdate, onRemove }: Props) {
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (relationships.length >= 5) return;
    onAdd(trimmed);
    setNewName('');
  };

  const totalScore = relationships.reduce((sum, r) => sum + calcScore(r), 0);

  return (
    <motion.div
      className="space-y-4 mt-4 pt-4 border-t border-border"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Inner Circle (Top 5)</h4>
        <span className="text-xs font-medium text-muted-foreground">
          Total Social Score: <span className="text-foreground font-bold">{totalScore}</span>
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Rate each dimension 1–5. Score = sum of all four ratings (max 20).
      </p>

      {relationships.map((rel) => (
        <RelationshipCard
          key={rel.id}
          relationship={rel}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ))}

      {relationships.length < 5 && (
        <div className="flex gap-2 items-center">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-8 text-sm flex-1"
            placeholder="Add a person..."
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
      )}
    </motion.div>
  );
}

function RelationshipCard({
  relationship: rel,
  onUpdate,
  onRemove,
}: {
  relationship: SocialRelationship;
  onUpdate: (id: string, updates: Partial<Omit<SocialRelationship, 'id'>>) => void;
  onRemove: (id: string) => void;
}) {
  const score = calcScore(rel);

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Input
          value={rel.name}
          onChange={(e) => onUpdate(rel.id, { name: e.target.value })}
          className="h-7 text-sm font-medium border-none bg-transparent p-0 focus-visible:ring-0 max-w-[200px]"
          placeholder="Name"
        />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Total: <span className="text-foreground font-bold">{score}</span>/20
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(rel.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TooltipProvider>
          {DIMENSIONS.map((dim) => (
            <div key={dim.key} className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-muted-foreground">{dim.label}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-xs">
                    <p className="font-medium mb-1">{dim.question}</p>
                    <p className="text-muted-foreground">High: {dim.high} · Low: {dim.low}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((num) => {
                  const selected = rel[dim.key] === num;
                  return (
                    <button
                      key={num}
                      onClick={() => onUpdate(rel.id, { [dim.key]: num })}
                      className={cn(
                        'h-7 w-7 rounded-md text-xs font-medium transition-all border',
                        selected
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-muted/50 text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
