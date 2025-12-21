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

// Get CSS styles for app-level rotation
export function getOrientationStyles(orientation: AppSettings['orientation']): React.CSSProperties {
  switch (orientation) {
    case 'portrait':
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vh',
        height: '100vw',
        transform: 'rotate(-90deg) translateX(-100%)',
        transformOrigin: 'top left',
        overflow: 'auto',
      };
    case 'portrait-inverted':
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vh',
        height: '100vw',
        transform: 'rotate(90deg) translateY(-100%)',
        transformOrigin: 'top left',
        overflow: 'auto',
      };
    case 'landscape-inverted':
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        transform: 'rotate(180deg)',
        transformOrigin: 'center center',
        overflow: 'auto',
      };
    default: // landscape
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'auto',
      };
  }
}
