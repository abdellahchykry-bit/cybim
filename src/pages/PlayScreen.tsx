import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { Campaign, MediaItem } from '@/types/campaign';

export default function PlayScreen() {
  const navigate = useNavigate();
  const { campaigns, settings, currentTime } = useApp();
  
  const [currentCampaignIndex, setCurrentCampaignIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Get active campaigns based on schedule
  const activeCampaigns = useMemo(() => {
    const now = currentTime;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return campaigns.filter((campaign) => {
      if (campaign.mediaItems.length === 0) return false;
      if (!campaign.schedule.enabled) return true;

      const [startH, startM] = campaign.schedule.startTime.split(':').map(Number);
      const [endH, endM] = campaign.schedule.endTime.split(':').map(Number);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    });
  }, [campaigns, currentTime]);

  useEffect(() => {
    if (activeCampaigns.length === 0) {
      // No active campaigns, go back
      navigate('/home');
    }
  }, [activeCampaigns, navigate]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Back') {
      navigate('/home');
    }
  }, [navigate]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const currentCampaign = activeCampaigns[currentCampaignIndex];
  const currentItem = currentCampaign?.mediaItems[currentMediaIndex];

  const advanceToNext = useCallback(() => {
    if (!currentCampaign) return;

    const nextMediaIndex = currentMediaIndex + 1;

    if (nextMediaIndex >= currentCampaign.mediaItems.length) {
      // End of current campaign
      if (currentCampaign.loop && activeCampaigns.length === 1) {
        // Loop single campaign
        setCurrentMediaIndex(0);
      } else {
        // Move to next campaign
        const nextCampaignIndex = currentCampaignIndex + 1;
        if (nextCampaignIndex >= activeCampaigns.length) {
          // All campaigns played, loop back to first
          setCurrentCampaignIndex(0);
          setCurrentMediaIndex(0);
        } else {
          setCurrentCampaignIndex(nextCampaignIndex);
          setCurrentMediaIndex(0);
        }
      }
    } else {
      setCurrentMediaIndex(nextMediaIndex);
    }
  }, [currentCampaign, currentMediaIndex, currentCampaignIndex, activeCampaigns.length]);

  useEffect(() => {
    if (!currentItem) return;

    if (currentItem.type === 'image') {
      const duration = (currentItem.duration || settings.defaultImageDuration) * 1000;
      const timer = setTimeout(advanceToNext, duration);
      return () => clearTimeout(timer);
    }
  }, [currentItem, settings.defaultImageDuration, advanceToNext]);

  const handleVideoEnded = () => {
    advanceToNext();
  };

  if (!currentCampaign || !currentItem) {
    return null;
  }

  const getAnimationVariants = () => {
    switch (settings.animation) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        };
      case 'slide':
        return {
          initial: { x: '100%', opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: '-100%', opacity: 0 },
        };
      case 'zoom':
        return {
          initial: { scale: 1.2, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 },
        };
      default:
        return {
          initial: {},
          animate: {},
          exit: {},
        };
    }
  };

  const variants = getAnimationVariants();

  return (
    <div className="fixed inset-0 bg-background cursor-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentCampaign.id}-${currentItem.id}`}
          className="absolute inset-0 flex items-center justify-center"
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: settings.animationDuration / 1000 }}
        >
          {currentItem.type === 'image' ? (
            <img
              src={currentItem.url}
              alt={currentItem.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <video
              src={currentItem.url}
              autoPlay
              onEnded={handleVideoEnded}
              className="h-full w-full object-contain"
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
