import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';

export default function PreviewScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { campaigns, settings } = useApp();
  
  const campaign = campaigns.find((c) => c.id === id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout>();
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const handleVideoCanPlay = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        // Try to unmute after play starts
        if (videoRef.current) {
          videoRef.current.muted = false;
        }
      }).catch(() => {
        // Autoplay blocked, keep muted and play
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(console.error);
        }
      });
    }
  };

  if (!campaign || campaign.mediaItems.length === 0) {
    return null;
  }

  const currentItem = campaign.mediaItems[currentIndex];
  
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
      className="fixed inset-0 bg-black cursor-none"
      onClick={handleScreenTap}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={currentItem.id}
          className="absolute inset-0 flex items-center justify-center"
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: currentItem.type === 'video' ? 0.1 : settings.animationDuration / 1000 }}
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
              loop={campaign.loop && campaign.mediaItems.length === 1}
              onCanPlay={handleVideoCanPlay}
              onEnded={handleVideoEnded}
              onError={(e) => console.error('Video error:', e)}
              className="h-full w-full object-contain"
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}