import { motion } from 'framer-motion';

interface DailyHourglassProps {
  elapsedSeconds: number;
  totalSeconds: number;
}

export function DailyHourglass({ elapsedSeconds, totalSeconds }: DailyHourglassProps) {
  const progress = Math.min(Math.max(elapsedSeconds / totalSeconds, 0), 1);
  
  // Top bulb: y ranges from 12 (top) to 58 (pinch)
  // Sand settles at BOTTOM of top bulb (like gravity), level drops from above
  const topBulbHeight = 46;
  const topSandHeight = (1 - progress) * topBulbHeight; // Remaining time
  const topSandY = 58 - topSandHeight; // Anchored at bottom of bulb (pinch), grows upward
  
  // Bottom bulb: y ranges from 62 (pinch) to 108 (bottom)
  // Sand settles at bottom, fills upward
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

        {/* Top sand - shows REMAINING time (sand settles at bottom, level drops from top) */}
        <g clipPath="url(#topBulbClip)">
          <motion.rect
            x="10"
            width="60"
            fill="hsl(210 90% 55%)"
            initial={{ y: topSandY, height: topSandHeight }}
            animate={{ 
              y: topSandY,
              height: topSandHeight 
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </g>

        {/* Bottom sand - shows ELAPSED time (fills from bottom up) */}
        <g clipPath="url(#bottomBulbClip)">
          <motion.rect
            x="10"
            width="60"
            fill="hsl(210 90% 55%)"
            initial={{ y: bottomSandY, height: bottomSandHeight }}
            animate={{ 
              y: bottomSandY,
              height: bottomSandHeight 
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </g>

        {/* Falling sand stream - visible when there's sand to fall */}
        {topSandHeight > 1 && (
          <motion.g>
            {/* Main stream */}
            <motion.line
              x1="40"
              y1="56"
              x2="40"
              y2="64"
              stroke="hsl(210 90% 55%)"
              strokeWidth="3"
              strokeLinecap="round"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            />
            {/* Particles effect */}
            <motion.circle
              cx="40"
              cy="60"
              r="1.5"
              fill="hsl(210 90% 55%)"
              animate={{ 
                cy: [58, 64],
                opacity: [1, 0]
              }}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
          </motion.g>
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
