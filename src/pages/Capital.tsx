import { Navigation } from '@/components/Navigation';
import { motion } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import { cn } from '@/lib/utils';

const CAPITAL_FORMS = [
  { id: 'material', name: 'Material Capital', icon: '🏗️', description: 'Raw and processed non-living resources: buildings, tools, fuel, stored goods.' },
  { id: 'intellectual', name: 'Intellectual Capital', icon: '🧠', description: 'Stored knowledge and ideas available to you.' },
  { id: 'experiential', name: 'Experiential Capital', icon: '🎯', description: '"Street smarts" — the difference between a novice and a master.' },
  { id: 'cultural', name: 'Cultural Capital', icon: '🎭', description: 'Shared art, music, myths, stories, ideas and worldviews of your community.' },
  { id: 'social', name: 'Social Capital', icon: '🤝', description: 'Goodwill, favors owed, connections and network from service to community.' },
  { id: 'natural', name: 'Natural Capital', icon: '🌿', description: 'Plants, animals, soil, and the collective properties of ecosystems.' },
  { id: 'spiritual', name: 'Spiritual Capital', icon: '✨', description: 'Capacity to live authentically and connect with something greater.' },
  { id: 'financial', name: 'Financial Capital', icon: '💰', description: 'Money, currency, and other financial assets acquired.' },
];

export default function Capital() {
  const { capitalRatings, setCapitalRating } = useUser();

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
              Rate your eight forms of capital to understand your true wealth.
            </p>
          </motion.header>

          {/* Overall Score */}
          <motion.div
            className="rounded-2xl border border-border bg-card p-6 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Overall Capital Score</p>
            <p className="text-5xl font-serif font-bold text-foreground">{totalScore}</p>
            <p className="text-sm text-muted-foreground mt-1">out of {maxScore}</p>
          </motion.div>

          {/* Capital Forms */}
          <div className="space-y-4">
            {CAPITAL_FORMS.map((form, index) => (
              <motion.div
                key={form.id}
                className="rounded-2xl border border-border bg-card p-5 space-y-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + index * 0.04 }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{form.icon}</span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-foreground">{form.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{form.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
                    const selected = capitalRatings[form.id] === num;
                    return (
                      <button
                        key={num}
                        onClick={() => setCapitalRating(form.id, num)}
                        className={cn(
                          'h-9 w-9 rounded-lg text-sm font-medium transition-all border',
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
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
