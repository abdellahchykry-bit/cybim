import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';

export default function PlayScreen() {
  const navigate = useNavigate();
  const { campaigns, settings, currentTime } = useApp();
  
  const [currentCampaignIndex, setCurrentCampaignIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout>();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Get active campaigns based on schedule
  const activeCampaigns = useMemo(() => {
    const now = currentTime;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay();

    return campaigns.filter((campaign) => {
      if (campaign.mediaItems.length === 0) return false;
      if (!campaign.schedule.enabled) return true;

      // Check if current day is in schedule
      if (campaign.schedule.days && campaign.schedule.days.length > 0) {
        if (!campaign.schedule.days.includes(currentDay)) return false;
      }

      const [startH, startM] = campaign.schedule.startTime.split(':').map(Number);
      const [endH, endM] = campaign.schedule.endTime.split(':').map(Number);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    });
  }, [campaigns, currentTime]);

  useEffect(() => {
    if (activeCampaigns.length === 0) {
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

  // Handle tap to exit (2 taps)
  const handleScreenTap = () => {
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    
    const newTapCount = tapCount + 1;
    setTapCount(newTapCount);
    
    if (newTapCount >= 2) {
      navigate('/home');
      return;
    }
    
    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  const currentCampaign = activeCampaigns[currentCampaignIndex];
  const currentItem = currentCampaign?.mediaItems[currentMediaIndex];

  const advanceToNext = useCallback(() => {
    if (!currentCampaign) return;

    const nextMediaIndex = currentMediaIndex + 1;

    if (nextMediaIndex >= currentCampaign.mediaItems.length) {
      if (currentCampaign.loop && activeCampaigns.length === 1) {
        setCurrentMediaIndex(0);
      } else {
        const nextCampaignIndex = currentCampaignIndex + 1;
        if (nextCampaignIndex >= activeCampaigns.length) {
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

  // Auto-play video when it changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play();
        }
      });
    }
  }, [currentMediaIndex, currentCampaignIndex]);

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
    <div 
      className="fixed inset-0 bg-background cursor-none"
      onClick={handleScreenTap}
    >
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
              ref={videoRef}
              key={currentItem.url}
              src={currentItem.url}
              autoPlay
              playsInline
              onEnded={handleVideoEnded}
              className="h-full w-full object-contain"
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}