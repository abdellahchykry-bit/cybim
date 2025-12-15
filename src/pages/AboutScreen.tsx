import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { CybimLogo } from '@/components/icons/CybimLogo';
import { TVCard, TVCardContent } from '@/components/ui/tv-card';
import { TVButton } from '@/components/ui/tv-button';

export default function AboutScreen() {
  return (
    <div className="min-h-screen pb-8">
      <NavigationBar />
      
      <main className="container mx-auto px-8 pt-24">
        <motion.div
          className="mx-auto max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <TVCard focusable={false} className="text-center py-12">
            {/* Logo */}
            <motion.div
              className="mb-6 inline-block animate-glow-pulse"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <CybimLogo className="mx-auto h-24 w-24 text-primary" />
            </motion.div>

            {/* Title */}
            <motion.h1
              className="font-display text-5xl font-black tracking-[0.2em]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              CYBIM
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="mt-2 font-display text-xl tracking-widest text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              Offline Signage Player
            </motion.p>

            <TVCardContent className="mt-8 space-y-6">
              {/* Description */}
              <motion.p
                className="text-muted-foreground max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                A professional offline digital signage player for Android displays. 
                Designed for commercial environments including TVs, totems, clinics, and shops.
              </motion.p>

              {/* Version */}
              <motion.div
                className="inline-block rounded-full bg-secondary px-6 py-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="ml-2 font-display font-bold">1.0.0</span>
              </motion.div>

              {/* Features List */}
              <motion.div
                className="mt-8 grid gap-3 text-left max-w-md mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-sm">Fully Offline Operation</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-sm">TV Remote Friendly</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-sm">Scheduled Campaigns</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-4 py-3">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <span className="text-sm">Multiple Orientations</span>
                </div>
              </motion.div>

              {/* Website Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                <TVButton
                  variant="outline"
                  onClick={() => window.open('https://www.cybim.com', '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  www.cybim.com
                </TVButton>
              </motion.div>
            </TVCardContent>
          </TVCard>
        </motion.div>
      </main>
    </div>
  );
}
