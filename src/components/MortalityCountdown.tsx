import { useTimeRemaining, useDayTimeRemaining } from '@/hooks/useTimeRemaining';
import { motion } from 'framer-motion';

interface MortalityCountdownProps {
  birthDate: Date;
  expectedLifespan: number;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function CountdownUnit({ 
  value, 
  label, 
  isLarge = false,
  delay = 0 
}: { 
  value: number; 
  label: string; 
  isLarge?: boolean;
  delay?: number;
}) {
  return (
    <motion.div 
      className={`text-center ${isLarge ? 'col-span-2 md:col-span-1' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <div className={`font-sans font-light tracking-tight ${
        isLarge ? 'text-4xl md:text-5xl lg:text-6xl' : 'text-2xl md:text-3xl lg:text-4xl'
      } text-foreground`}>
        {formatNumber(value)}
      </div>
      <div className="text-xs md:text-sm uppercase tracking-widest text-muted-foreground mt-1">
        {label}
      </div>
    </motion.div>
  );
}

export function MortalityCountdown({ birthDate, expectedLifespan }: MortalityCountdownProps) {
  const lifeRemaining = useTimeRemaining(birthDate, expectedLifespan);
  const dayRemaining = useDayTimeRemaining();

  return (
    <div className="space-y-8">
      {/* Day remaining - prominent */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
          Seconds remaining today
        </h3>
        <div className="font-sans text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-life-energy">
          {formatNumber(dayRemaining.seconds)}
        </div>
      </motion.div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Life remaining</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Life remaining grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        <CountdownUnit value={lifeRemaining.years} label="Years" isLarge delay={0.1} />
        <CountdownUnit value={lifeRemaining.months} label="Months" delay={0.15} />
        <CountdownUnit value={lifeRemaining.weeks} label="Weeks" delay={0.2} />
        <CountdownUnit value={lifeRemaining.days} label="Days" delay={0.25} />
      </div>

      {/* Seconds ticker - more subtle */}
      <motion.div 
        className="text-center pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="inline-flex items-baseline gap-2 px-6 py-3 rounded-full bg-muted/50">
          <span className="text-2xl md:text-3xl font-sans font-light text-muted-foreground">
            {formatNumber(lifeRemaining.seconds)}
          </span>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            seconds of life
          </span>
        </div>
      </motion.div>
    </div>
  );
}
