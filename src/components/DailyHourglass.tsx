import { motion } from 'framer-motion';

interface DailyHourglassProps {
  elapsedSeconds: number;
  totalSeconds: number;
}

export function DailyHourglass({ elapsedSeconds, totalSeconds }: DailyHourglassProps) {
  const progress = Math.min(Math.max(elapsedSeconds / totalSeconds, 0), 1);
  
  // Top bulb: y ranges from 12 (top) to 58 (pinch)
  // Height of top bulb area = 46 pixels
  const topBulbHeight = 46;
  const topSandHeight = (1 - progress) * topBulbHeight; // Remaining time
  const topSandY = 12; // Always anchored at top
  
  // Bottom bulb: y ranges from 62 (pinch) to 108 (bottom)
  // Height of bottom bulb area = 46 pixels
  const bottomBulbHeight = 46;
  const bottomSandHeight = progress * bottomBulbHeight; // Elapsed time
  const bottomSandY = 108 - bottomSandHeight; // Rises from bottom

  return (
    <div className="relative w-16 h-24 md:w-20 md:h-32">
      <svg
        viewBox="0 0 80 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Clip path for top bulb - curved shape */}
          <clipPath id="topBulbClip">
            <path d="M15 12 L65 12 L65 15 Q65 50 40 58 Q15 50 15 15 Z" />
          </clipPath>
          {/* Clip path for bottom bulb - curved shape */}
          <clipPath id="bottomBulbClip">
            <path d="M40 62 Q65 70 65 105 L65 108 L15 108 L15 105 Q15 70 40 62 Z" />
          </clipPath>
        </defs>

        {/* Top sand - shows REMAINING time (depletes as day progresses) */}
        <g clipPath="url(#topBulbClip)">
          <motion.rect
            x="10"
            y={topSandY}
            width="60"
            animate={{ height: topSandHeight }}
            className="fill-hourglass-sand"
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </g>

        {/* Bottom sand - shows ELAPSED time (fills as day progresses) */}
        <g clipPath="url(#bottomBulbClip)">
          <motion.rect
            x="10"
            width="60"
            className="fill-hourglass-sand"
            animate={{ 
              y: bottomSandY,
              height: bottomSandHeight 
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </g>

        {/* Falling sand stream in the middle */}
        {progress > 0.01 && progress < 0.99 && (
          <motion.line
            x1="40"
            y1="58"
            x2="40"
            y2="62"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-hourglass-sand"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}

        {/* Glass frame - top bulb */}
        <path
          d="M15 12 L15 15 Q15 50 40 58"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-muted-foreground/50"
        />
        <path
          d="M65 12 L65 15 Q65 50 40 58"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-muted-foreground/50"
        />

        {/* Glass frame - bottom bulb */}
        <path
          d="M40 62 Q15 70 15 105 L15 108"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-muted-foreground/50"
        />
        <path
          d="M40 62 Q65 70 65 105 L65 108"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-muted-foreground/50"
        />

        {/* Top cap */}
        <rect x="10" y="8" width="60" height="5" rx="2" className="fill-muted-foreground/70" />
        
        {/* Bottom cap */}
        <rect x="10" y="107" width="60" height="5" rx="2" className="fill-muted-foreground/70" />

        {/* Center pinch ring */}
        <ellipse cx="40" cy="60" rx="6" ry="3" className="fill-muted-foreground/40" />
      </svg>
    </div>
  );
}
