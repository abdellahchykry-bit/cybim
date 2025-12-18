import { useEffect } from 'react';
import { AppSettings } from '@/types/campaign';

export function useOrientation(orientation: AppSettings['orientation']) {
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        // Use Screen Orientation API if available
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
        // Orientation lock may fail if not in fullscreen or not supported
        console.warn('Orientation lock not supported or failed:', error);
      }
    };

    lockOrientation();

    // Cleanup: unlock orientation when component unmounts
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

// Apply orientation via CSS transform as fallback
export function getOrientationStyle(orientation: AppSettings['orientation']): React.CSSProperties {
  switch (orientation) {
    case 'landscape-inverted':
      return { transform: 'rotate(180deg)' };
    case 'portrait':
      return { transform: 'rotate(-90deg)', transformOrigin: 'center center' };
    case 'portrait-inverted':
      return { transform: 'rotate(90deg)', transformOrigin: 'center center' };
    default:
      return {};
  }
}
