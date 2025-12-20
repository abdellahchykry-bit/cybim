import { useEffect } from 'react';
import { AppSettings } from '@/types/campaign';

export function useOrientation(orientation: AppSettings['orientation']) {
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        const screenOrientation = screen.orientation;
        if (screenOrientation && typeof (screenOrientation as any).lock === 'function') {
          let lockType: string;
          
          switch (orientation) {
            case 'landscape':
              lockType = 'landscape-primary';
              break;
            case 'landscape-inverted':
              lockType = 'landscape-secondary';
              break;
            case 'portrait':
              lockType = 'portrait-primary';
              break;
            case 'portrait-inverted':
              lockType = 'portrait-secondary';
              break;
            default:
              lockType = 'landscape-primary';
          }
          
          await (screenOrientation as any).lock(lockType);
        }
      } catch (error) {
        console.warn('Orientation lock not supported or failed:', error);
      }
    };

    lockOrientation();

    return () => {
      try {
        const screenOrientation = screen.orientation;
        if (screenOrientation && typeof (screenOrientation as any).unlock === 'function') {
          (screenOrientation as any).unlock();
        }
      } catch {
        // Ignore unlock errors
      }
    };
  }, [orientation]);
}

// CSS-based orientation that works in all environments including Lovable preview
export function getOrientationStyle(orientation: AppSettings['orientation']): {
  transform: string;
  width: string;
  height: string;
} {
  switch (orientation) {
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
        transform: '',
        width: '100vw',
        height: '100vh',
      };
  }
}
