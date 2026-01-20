import { motion } from 'framer-motion';

interface DailyHourglassProps {
  elapsedSeconds: number;
  totalSeconds: number;
}

export function DailyHourglass({ elapsedSeconds, totalSeconds }: DailyHourglassProps) {
  const progress = Math.min(Math.max(elapsedSeconds / totalSeconds, 0), 1);
  
  // Top sand level: starts full (at top), depletes as time passes
  // Range from 15 (full) to 55 (empty, near the pinch)
  const topSandLevel = 15 + (progress * 40);
  
  // Bottom sand level: starts empty (at bottom), fills as time passes  
  // Range from 105 (empty) to 65 (full, near the pinch)
  const bottomSandLevel = 105 - (progress * 40);

  return (
    <div className="relative w-16 h-24 md:w-20 md:h-32">
      <svg
        viewBox="0 0 80 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Clip path for top bulb */}
          <clipPath id="topBulbClip">
            <path d="M15 12 L65 12 L65 15 Q65 50 40 58 Q15 50 15 15 Z" />
          </clipPath>
          {/* Clip path for bottom bulb */}
          <clipPath id="bottomBulbClip">
            <path d="M40 62 Q65 70 65 105 L65 108 L15 108 L15 105 Q15 70 40 62 Z" />
          </clipPath>
        </defs>

        {/* Top sand - remaining time */}
        <g clipPath="url(#topBulbClip)">
          <motion.rect
            x="10"
            width="60"
            height="50"
            className="fill-hourglass-sand"
            animate={{ y: topSandLevel }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </g>

        {/* Bottom sand - elapsed time */}
        <g clipPath="url(#bottomBulbClip)">
          <motion.rect
            x="10"
            width="60"
            height="50"
            className="fill-hourglass-sand"
            animate={{ y: bottomSandLevel }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </g>

        {/* Falling sand stream in the middle */}
        {progress > 0 && progress < 1 && (
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
