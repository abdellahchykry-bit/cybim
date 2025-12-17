import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CybimLogo } from '@/components/icons/CybimLogo';
import { useApp } from '@/contexts/AppContext';

export default function SplashScreen() {
  const navigate = useNavigate();
  const { isDataLoaded } = useApp();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Minimum display time for splash
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Navigate only when both data is loaded AND minimum time has passed
  useEffect(() => {
    if (isDataLoaded && minTimeElapsed) {
      navigate('/home', { replace: true });
    }
  }, [isDataLoaded, minTimeElapsed, navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-2xl"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }}
        />
      </div>

      {/* Logo container */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Logo with glow */}
        <motion.div
          className="animate-glow-pulse"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <CybimLogo className="h-32 w-32 text-primary" animate />
        </motion.div>

        {/* Title */}
        <motion.h1
          className="mt-6 font-display text-6xl font-black tracking-[0.3em] text-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          CYBIM
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="mt-3 font-display text-xl tracking-widest text-primary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          Offline Signage Player
        </motion.p>

        {/* Loading indicator */}
        <motion.div
          className="mt-12 h-1 w-48 overflow-hidden rounded-full bg-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.2 }}
        >
          <motion.div
            className="h-full bg-primary"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 1,
              delay: 1.3,
              ease: 'easeInOut',
              repeat: isDataLoaded ? 0 : Infinity,
            }}
          />
        </motion.div>

        {/* Loading text */}
        <motion.p
          className="mt-4 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.5 }}
        >
          {isDataLoaded ? 'Ready' : 'Loading data...'}
        </motion.p>
      </motion.div>
    </div>
  );
}
