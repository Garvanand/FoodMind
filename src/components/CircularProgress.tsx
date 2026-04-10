import { motion } from 'motion/react';

interface RingProps {
  size: number;
  strokeWidth: number;
  percentage: number;
  color: string;
  delay?: number;
}

export function CircularProgress({ size, strokeWidth, percentage, color, delay = 0 }: RingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        className="text-white/5"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, delay, ease: "easeOut" }}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MultiRingProgress({ rings }: { rings: RingProps[] }) {
  const maxSize = Math.max(...rings.map(r => r.size));

  return (
    <div className="relative flex items-center justify-center" style={{ width: maxSize, height: maxSize }}>
      {rings.map((ring, i) => (
        <div key={i} className="absolute inset-0 flex items-center justify-center">
          <CircularProgress {...ring} />
        </div>
      ))}
    </div>
  );
}
