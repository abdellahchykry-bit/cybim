import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { getOrientationStyle } from '@/hooks/useOrientation';

export default function PreviewScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { campaigns, settings } = useApp();
  
  const campaign = campaigns.find((c) => c.id === id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!campaign || campaign.mediaItems.length === 0) {
      navigate('/home');
      return;
    }
  }, [campaign, navigate]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Back') {
      navigate(-1);
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
      navigate(-1);
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

  // Get next item for preloading
  const getNextItem = useCallback(() => {
    if (!campaign) return null;
    const nextIndex = currentIndex + 1;
    if (nextIndex < campaign.mediaItems.length) {
      return campaign.mediaItems[nextIndex];
    }
    if (campaign.loop) {
      return campaign.mediaItems[0];
    }
    return null;
  }, [campaign, currentIndex]);

  const nextItem = getNextItem();

  // Preload next video
  useEffect(() => {
    if (nextItem?.type === 'video' && nextVideoRef.current) {
      nextVideoRef.current.src = nextItem.url;
      nextVideoRef.current.load();
    }
  }, [nextItem]);

  useEffect(() => {
    if (!campaign) return;
    
    const currentItem = campaign.mediaItems[currentIndex];
    if (!currentItem) return;

    if (currentItem.type === 'image') {
      const duration = (currentItem.duration || settings.defaultImageDuration) * 1000;
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next >= campaign.mediaItems.length) {
            if (campaign.loop) return 0;
            navigate(-1);
            return prev;
          }
          return next;
        });
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, campaign, settings.defaultImageDuration, navigate]);

  // Force autoplay for video after transition
  useEffect(() => {
    const currentItem = campaign?.mediaItems[currentIndex];
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
  }, [currentIndex, campaign]);

  const handleVideoEnded = () => {
    if (!campaign) return;
    
    // If single video with loop, video element handles looping via loop attribute
    if (campaign.mediaItems.length === 1 && campaign.loop) {
      return;
    }
    
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next >= campaign.mediaItems.length) {
        if (campaign.loop) return 0;
        navigate(-1);
        return prev;
      }
      return next;
    });
  };

  if (!campaign || campaign.mediaItems.length === 0) {
    return null;
  }

  const currentItem = campaign.mediaItems[currentIndex];
  
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
            key={currentItem.id}
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
                loop={campaign.loop && campaign.mediaItems.length === 1}
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
