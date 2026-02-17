import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

export default function PreviewScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { campaigns, settings } = useApp();
  
  const campaign = campaigns.find((c) => c.id === id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [activePlayer, setActivePlayer] = useState<'A' | 'B'>('A');
  
  const tapTimeoutRef = useRef<NodeJS.Timeout>();
  const imageTimerRef = useRef<NodeJS.Timeout>();
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);

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
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    };
  }, []);

  const getNextIndex = useCallback(() => {
    if (!campaign) return 0;
    const next = currentIndex + 1;
    if (next >= campaign.mediaItems.length) {
      return settings.loop ? 0 : -1;
    }
    return next;
  }, [campaign, currentIndex, settings.loop]);

  const nextIndex = getNextIndex();
  const nextItem = campaign && nextIndex >= 0 ? campaign.mediaItems[nextIndex] : null;
  const currentItem = campaign?.mediaItems[currentIndex];

  const advanceToNext = useCallback(() => {
    if (!campaign) return;
    
    const next = getNextIndex();
    if (next < 0) {
      navigate(-1);
      return;
    }
    
    if (campaign.mediaItems[next]?.type === 'video') {
      setActivePlayer(prev => prev === 'A' ? 'B' : 'A');
    }
    
    setCurrentIndex(next);
  }, [campaign, getNextIndex, navigate]);

  useEffect(() => {
    if (!nextItem || nextItem.type !== 'video') return;
    
    const inactiveRef = activePlayer === 'A' ? videoRefB : videoRefA;
    
    if (inactiveRef.current) {
      inactiveRef.current.src = nextItem.url;
      inactiveRef.current.load();
    }
  }, [nextItem, activePlayer]);

  useEffect(() => {
    if (!currentItem || currentItem.type !== 'image') return;
    
    if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    
    const duration = (currentItem.duration || settings.defaultImageDuration) * 1000;
    imageTimerRef.current = setTimeout(advanceToNext, duration);
    
    return () => {
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    };
  }, [currentItem, settings.defaultImageDuration, advanceToNext]);

  useEffect(() => {
    if (!currentItem || currentItem.type !== 'video') return;
    
    const activeRef = activePlayer === 'A' ? videoRefA : videoRefB;
    const video = activeRef.current;
    
    if (!video) return;

    const startPlayback = () => {
      video.currentTime = 0;
      video.muted = true;
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          video.muted = false;
        }).catch((err) => {
          console.log('Play failed, retrying muted:', err);
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    };

    const handleCanPlay = () => {
      startPlayback();
    };

    const currentSrc = video.src;
    const targetSrc = currentItem.url;
    
    if (currentSrc === targetSrc && video.readyState >= 3) {
      startPlayback();
    } else {
      video.src = targetSrc;
      video.addEventListener('canplay', handleCanPlay, { once: true });
      video.load();
    }
    
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentItem, activePlayer, currentIndex]);

  const handleVideoEnded = useCallback(() => {
    if (!campaign) return;
    
    if (campaign.mediaItems.length === 1 && settings.loop) {
      return;
    }
    
    advanceToNext();
  }, [campaign, advanceToNext, settings.loop]);

  if (!campaign || campaign.mediaItems.length === 0 || !currentItem) {
    return null;
  }

  const getOrientationStyles = () => {
    switch (settings.orientation) {
      case 'portrait':
        return { transform: 'rotate(-90deg)', width: '100vh', height: '100vw' };
      case 'portrait-inverted':
        return { transform: 'rotate(90deg)', width: '100vh', height: '100vw' };
      case 'landscape-inverted':
        return { transform: 'rotate(180deg)', width: '100vw', height: '100vh' };
      default:
        return { width: '100vw', height: '100vh' };
    }
  };

  const orientationStyles = getOrientationStyles();
  const isVideoA = activePlayer === 'A';
  const shouldLoop = settings.loop && campaign.mediaItems.length === 1;

  return (
    <div 
      className="fixed inset-0 bg-black cursor-none overflow-hidden"
      onClick={handleScreenTap}
    >
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div
          className="flex items-center justify-center"
          style={{
            ...orientationStyles,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) ${orientationStyles.transform || ''}`,
          }}
        >
          {currentItem.type === 'image' && (
            <img
              src={currentItem.url}
              alt={currentItem.name}
              className="max-w-full max-h-full object-contain"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}

          <video
            ref={videoRefA}
            muted
            playsInline
            controls={false}
            disablePictureInPicture
            loop={shouldLoop}
            onEnded={handleVideoEnded}
            className="max-w-full max-h-full object-contain"
            style={{ 
              width: '100%', height: '100%', objectFit: 'contain',
              position: 'absolute', top: 0, left: 0,
              opacity: currentItem.type === 'video' && isVideoA ? 1 : 0,
              pointerEvents: 'none',
              zIndex: isVideoA ? 2 : 1,
            }}
          />

          <video
            ref={videoRefB}
            muted
            playsInline
            controls={false}
            disablePictureInPicture
            loop={shouldLoop}
            onEnded={handleVideoEnded}
            className="max-w-full max-h-full object-contain"
            style={{ 
              width: '100%', height: '100%', objectFit: 'contain',
              position: 'absolute', top: 0, left: 0,
              opacity: currentItem.type === 'video' && !isVideoA ? 1 : 0,
              pointerEvents: 'none',
              zIndex: !isVideoA ? 2 : 1,
            }}
          />
        </div>
      </div>
    </div>
  );
}
