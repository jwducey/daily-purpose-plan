import { motion } from 'framer-motion';

interface DailyHourglassProps {
  elapsedSeconds: number;
  totalSeconds: number;
}

export function DailyHourglass({ elapsedSeconds, totalSeconds }: DailyHourglassProps) {
  const progress = Math.min(elapsedSeconds / totalSeconds, 1);

  return (
    <div className="relative w-16 h-24 md:w-20 md:h-32">
      {/* Hourglass frame */}
      <svg
        viewBox="0 0 80 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Glass outline */}
        <path
          d="M10 10 L10 15 Q10 45 40 60 Q10 75 10 105 L10 110 L70 110 L70 105 Q70 75 40 60 Q70 45 70 15 L70 10 Z"
          stroke="currentColor"
          strokeWidth="3"
          className="text-muted-foreground/40"
          fill="transparent"
        />
        
        {/* Top sand container clip path */}
        <defs>
          <clipPath id="topSandClip">
            <path d="M12 12 L12 15 Q12 43 40 58 L40 58 Q68 43 68 15 L68 12 Z" />
          </clipPath>
          <clipPath id="bottomSandClip">
            <path d="M12 62 Q12 77 12 108 L68 108 Q68 77 68 62 Q40 77 40 62 Z" />
          </clipPath>
        </defs>
        
        {/* Top sand */}
        <g clipPath="url(#topSandClip)">
          <motion.rect
            x="10"
            y="10"
            width="60"
            height="50"
            className="fill-hourglass-sand"
            initial={{ y: 10 }}
            animate={{ 
              y: 10 + (50 * progress),
              height: Math.max(0, 50 - (50 * progress))
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </g>
        
        {/* Bottom sand */}
        <g clipPath="url(#bottomSandClip)">
          <motion.rect
            x="10"
            width="60"
            className="fill-hourglass-sand"
            initial={{ y: 108, height: 0 }}
            animate={{ 
              y: 108 - (46 * progress),
              height: 46 * progress
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </g>
        
        {/* Falling sand stream */}
        {progress < 1 && (
          <motion.line
            x1="40"
            y1="58"
            x2="40"
            y2={62 + (46 * (1 - progress))}
            stroke="currentColor"
            strokeWidth="2"
            className="text-hourglass-sand"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
        
        {/* Top cap */}
        <rect x="5" y="5" width="70" height="6" rx="2" className="fill-muted-foreground/60" />
        
        {/* Bottom cap */}
        <rect x="5" y="109" width="70" height="6" rx="2" className="fill-muted-foreground/60" />
        
        {/* Center pinch decoration */}
        <ellipse cx="40" cy="60" rx="8" ry="4" className="fill-muted-foreground/30" />
      </svg>
    </div>
  );
}
