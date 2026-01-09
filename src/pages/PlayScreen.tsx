import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

export default function PlayScreen() {
  const navigate = useNavigate();
  const { campaigns, settings, currentTime } = useApp();
  
  const [currentCampaignIndex, setCurrentCampaignIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [activePlayer, setActivePlayer] = useState<'A' | 'B'>('A');
  const [playerBReady, setPlayerBReady] = useState(false);
  const [playerAReady, setPlayerAReady] = useState(false);
  
  const tapTimeoutRef = useRef<NodeJS.Timeout>();
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);
  const imageTimerRef = useRef<NodeJS.Timeout>();

  // Get active campaigns based on schedule
  const activeCampaigns = useMemo(() => {
    const now = currentTime;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay();

    return campaigns.filter((campaign) => {
      if (campaign.mediaItems.length === 0) return false;
      if (!campaign.schedule.enabled) return true;

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
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    };
  }, []);

  const currentCampaign = activeCampaigns[currentCampaignIndex];
  const currentItem = currentCampaign?.mediaItems[currentMediaIndex];

  // Calculate next indices
  const getNextIndices = useCallback(() => {
    if (!currentCampaign) return null;
    
    let nextMediaIdx = currentMediaIndex + 1;
    let nextCampaignIdx = currentCampaignIndex;
    
    if (nextMediaIdx >= currentCampaign.mediaItems.length) {
      if (currentCampaign.loop && activeCampaigns.length === 1) {
        nextMediaIdx = 0;
      } else {
        nextCampaignIdx = currentCampaignIndex + 1;
        if (nextCampaignIdx >= activeCampaigns.length) {
          nextCampaignIdx = 0;
        }
        nextMediaIdx = 0;
      }
    }
    
    return { campaignIdx: nextCampaignIdx, mediaIdx: nextMediaIdx };
  }, [currentCampaign, currentMediaIndex, currentCampaignIndex, activeCampaigns]);

  const nextIndices = getNextIndices();
  const nextItem = nextIndices ? activeCampaigns[nextIndices.campaignIdx]?.mediaItems[nextIndices.mediaIdx] : null;

  const advanceToNext = useCallback(() => {
    const next = getNextIndices();
    if (!next) return;
    
    // Switch active player for videos
    if (nextItem?.type === 'video') {
      setActivePlayer(prev => prev === 'A' ? 'B' : 'A');
    }
    
    setCurrentCampaignIndex(next.campaignIdx);
    setCurrentMediaIndex(next.mediaIdx);
  }, [getNextIndices, nextItem]);

  // Preload next video in inactive player
  useEffect(() => {
    if (!nextItem || nextItem.type !== 'video') return;
    
    const inactiveRef = activePlayer === 'A' ? videoRefB : videoRefA;
    const setReady = activePlayer === 'A' ? setPlayerBReady : setPlayerAReady;
    
    if (inactiveRef.current) {
      setReady(false);
      inactiveRef.current.src = nextItem.url;
      inactiveRef.current.load();
    }
  }, [nextItem, activePlayer]);

  // Handle image duration timer
  useEffect(() => {
    if (!currentItem || currentItem.type !== 'image') return;
    
    if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    
    const duration = (currentItem.duration || settings.defaultImageDuration) * 1000;
    imageTimerRef.current = setTimeout(advanceToNext, duration);
    
    return () => {
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    };
  }, [currentItem, settings.defaultImageDuration, advanceToNext]);

  // Play video when it becomes current - wait for canplay event
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

    // Always set source and play
    const currentSrc = video.src;
    const targetSrc = currentItem.url;
    
    // Check if already loaded with correct source
    if (currentSrc === targetSrc && video.readyState >= 3) {
      startPlayback();
    } else {
      // Set source and wait for canplay
      video.src = targetSrc;
      video.addEventListener('canplay', handleCanPlay, { once: true });
      video.load();
    }
    
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentItem, activePlayer, currentMediaIndex, currentCampaignIndex]);

  const handleVideoEnded = useCallback(() => {
    if (!currentCampaign) return;
    
    if (currentCampaign.mediaItems.length === 1 && currentCampaign.loop) {
      return;
    }
    
    advanceToNext();
  }, [currentCampaign, advanceToNext]);

  const handleVideoCanPlay = useCallback((player: 'A' | 'B') => {
    if (player === 'A') setPlayerAReady(true);
    else setPlayerBReady(true);
  }, []);

  if (!currentCampaign || !currentItem) {
    return null;
  }

  // Get orientation styles
  const getOrientationStyles = () => {
    switch (settings.orientation) {
      case 'portrait':
        return {
          transform: 'rotate(-90deg)',
          width: '100vh',
          height: '100vw',
        };
      case 'portrait-inverted':
        return {
          transform: 'rotate(90deg)',
          width: '100vh',
          height: '100vw',
        };
      case 'landscape-inverted':
        return {
          transform: 'rotate(180deg)',
          width: '100vw',
          height: '100vh',
        };
      default:
        return {
          width: '100vw',
          height: '100vh',
        };
    }
  };

  const orientationStyles = getOrientationStyles();
  const isVideoA = activePlayer === 'A';
  const shouldLoop = currentCampaign.loop && currentCampaign.mediaItems.length === 1;

  return (
    <div 
      className="fixed inset-0 bg-black cursor-none overflow-hidden"
      onClick={handleScreenTap}
    >
      <div 
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
      >
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
          {/* Current image */}
          {currentItem.type === 'image' && (
            <img
              src={currentItem.url}
              alt={currentItem.name}
              className="max-w-full max-h-full object-contain"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}

          {/* Video Player A */}
          <video
            ref={videoRefA}
            muted
            playsInline
            controls={false}
            loop={shouldLoop}
            onEnded={handleVideoEnded}
            onCanPlay={() => handleVideoCanPlay('A')}
            className="max-w-full max-h-full object-contain"
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: currentItem.type === 'video' && isVideoA ? 1 : 0,
              pointerEvents: 'none',
              zIndex: isVideoA ? 2 : 1,
            }}
          />

          {/* Video Player B */}
          <video
            ref={videoRefB}
            muted
            playsInline
            controls={false}
            loop={shouldLoop}
            onEnded={handleVideoEnded}
            onCanPlay={() => handleVideoCanPlay('B')}
            className="max-w-full max-h-full object-contain"
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              position: 'absolute',
              top: 0,
              left: 0,
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
