import { motion } from 'framer-motion';

interface CybimLogoProps {
  className?: string;
  animate?: boolean;
}

export function CybimLogo({ className = '', animate = false }: CybimLogoProps) {
  const iconVariants = animate ? {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
  } : {};

  return (
    <motion.svg
      viewBox="0 0 120 100"
      className={className}
      {...(animate ? iconVariants : {})}
      transition={{ duration: 0.5 }}
    >
      {/* Screen outline */}
      <motion.rect
        x="10"
        y="10"
        width="80"
        height="55"
        rx="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        className="text-primary"
        initial={animate ? { pathLength: 0 } : {}}
        animate={animate ? { pathLength: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
      {/* Screen stand */}
      <motion.path
        d="M40 65 L40 78 L30 78 L70 78 L60 78 L60 65"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
        initial={animate ? { opacity: 0 } : {}}
        animate={animate ? { opacity: 1 } : {}}
        transition={{ duration: 0.3, delay: 0.8 }}
      />
      {/* Play button */}
      <motion.polygon
        points="40,25 40,50 60,37.5"
        fill="currentColor"
        className="text-primary"
        initial={animate ? { opacity: 0, scale: 0 } : {}}
        animate={animate ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.4, delay: 1 }}
      />
    </motion.svg>
  );
}
