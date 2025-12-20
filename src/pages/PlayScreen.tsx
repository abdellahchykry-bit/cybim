import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { getOrientationStyle } from '@/hooks/useOrientation';

export default function PlayScreen() {
  const navigate = useNavigate();
  const { campaigns, settings, currentTime } = useApp();
  
  const [currentCampaignIndex, setCurrentCampaignIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);

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

  // Get next item for preloading
  const getNextItem = useCallback(() => {
    if (!currentCampaign) return null;
    const nextMediaIndex = currentMediaIndex + 1;
    if (nextMediaIndex < currentCampaign.mediaItems.length) {
      return currentCampaign.mediaItems[nextMediaIndex];
    }
    // Check next campaign
    const nextCampaignIndex = currentCampaignIndex + 1;
    if (nextCampaignIndex < activeCampaigns.length) {
      return activeCampaigns[nextCampaignIndex]?.mediaItems[0];
    }
    // Loop back
    if (currentCampaign.loop || activeCampaigns.length > 0) {
      return activeCampaigns[0]?.mediaItems[0];
    }
    return null;
  }, [currentCampaign, currentMediaIndex, currentCampaignIndex, activeCampaigns]);

  const nextItem = getNextItem();

  // Preload next video
  useEffect(() => {
    if (nextItem?.type === 'video' && nextVideoRef.current) {
      nextVideoRef.current.src = nextItem.url;
      nextVideoRef.current.load();
    }
  }, [nextItem]);

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

  // Force autoplay for video after transition
  useEffect(() => {
    if (currentItem?.type === 'video' && videoRef.current) {
      const video = videoRef.current;
      // Reset and force play
      video.currentTime = 0;
      video.muted = true;
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          // Try to unmute after play starts
          video.muted = false;
        }).catch(() => {
          // Keep muted if autoplay with sound is blocked
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    }
  }, [currentItem?.id, currentItem?.type]);

  const handleVideoEnded = () => {
    if (!currentCampaign) return;
    
    // If single video with loop, video element handles looping via loop attribute
    if (currentCampaign.mediaItems.length === 1 && currentCampaign.loop) {
      return;
    }
    
    advanceToNext();
  };

  if (!currentCampaign || !currentItem) {
    return null;
  }

  const getAnimationVariants = () => {
    // No animation for videos to avoid black screen
    if (currentItem.type === 'video') {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      };
    }

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
  const orientationStyle = getOrientationStyle(settings.orientation);
  const isRotated = settings.orientation === 'portrait' || settings.orientation === 'portrait-inverted';

  return (
    <div 
      className="fixed inset-0 bg-black cursor-none overflow-hidden"
      onClick={handleScreenTap}
    >
      <div 
        className="absolute flex items-center justify-center"
        style={{
          ...orientationStyle,
          ...(isRotated ? {
            width: '100vh',
            height: '100vw',
            top: '50%',
            left: '50%',
            marginTop: '-50vw',
            marginLeft: '-50vh',
          } : {
            inset: 0,
          }),
        }}
      >
        <AnimatePresence mode="sync">
          <motion.div
            key={`${currentCampaign.id}-${currentItem.id}`}
            className="absolute inset-0 flex items-center justify-center"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: currentItem.type === 'video' ? 0 : settings.animationDuration / 1000 }}
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
                muted
                autoPlay
                playsInline
                controls={false}
                loop={currentCampaign.loop && currentCampaign.mediaItems.length === 1}
                onEnded={handleVideoEnded}
                onError={(e) => console.error('Video error:', e)}
                className="h-full w-full object-contain"
                style={{ 
                  pointerEvents: 'none',
                  WebkitMediaControlsPlayButton: 'none',
                } as React.CSSProperties}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hidden preload video for next item */}
      {nextItem?.type === 'video' && (
        <video
          ref={nextVideoRef}
          preload="auto"
          muted
          playsInline
          className="hidden"
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
}
