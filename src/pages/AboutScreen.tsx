import { motion } from 'framer-motion';
import { Monitor, Settings, Play, CheckCircle2, ExternalLink } from 'lucide-react';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { TVButton } from '@/components/ui/tv-button';

export default function AboutScreen() {
  const features = [
    'Create and manage multiple campaigns',
    'Upload images and videos (up to 10MB each)',
    'Set custom durations for images (5s, 10s, 15s, 20s, 30s, 60s)',
    'Schedule campaigns to run at specific times',
    'Multiple screen orientations supported',
    'Works completely offline',
  ];

  const cards = [
    {
      icon: Monitor,
      title: 'Offline Operation',
      description: 'Works completely offline - no internet required after setup.',
    },
    {
      icon: Settings,
      title: 'Easy Scheduling',
      description: 'Schedule campaigns to run at specific times and days.',
    },
    {
      icon: Play,
      title: 'Media Support',
      description: 'Supports images and videos with smooth transitions.',
    },
  ];

  return (
    <div className="min-h-screen pb-8">
      <NavigationBar />

      <main className="container mx-auto px-8 pt-24 max-w-4xl">
        {/* Title */}
        <motion.h1
          className="font-display text-4xl font-black text-primary mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          What is CYBIM?
        </motion.h1>

        {/* Description */}
        <motion.p
          className="text-lg text-muted-foreground mb-12 max-w-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          CYBIM is a professional digital signage player for businesses, retail stores, restaurants, and public displays. It enables you to create and manage multimedia campaigns locally and transforms any standard Android TV into a powerful, professional signage solution.
        </motion.p>

        {/* Feature Cards */}
        <motion.div
          className="grid gap-6 md:grid-cols-3 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {cards.map((card, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-card p-6 space-y-4"
            >
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10">
                <card.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className="font-display text-2xl font-bold mb-6">Features</h2>
          <div className="space-y-3 mb-12">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Version & Website */}
        <motion.div
          className="flex items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <span className="rounded-full bg-secondary px-4 py-2 text-sm">
            <span className="text-muted-foreground">Version</span>
            <span className="ml-2 font-display font-bold">1.0.0</span>
          </span>
          <TVButton
            variant="outline"
            onClick={() => window.open('https://www.cybim.com', '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            www.cybim.com
          </TVButton>
        </motion.div>
      </main>
    </div>
  );
}
