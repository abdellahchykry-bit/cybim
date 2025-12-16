export interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string; // base64 data URL for persistence
  duration?: number; // in seconds, for images
}

export interface CampaignSchedule {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  days: number[]; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  enabled: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  mediaItems: MediaItem[];
  schedule: CampaignSchedule;
  loop: boolean;
  autoPlay: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSettings {
  orientation: 'landscape' | 'landscape-inverted' | 'portrait' | 'portrait-inverted';
  animation: 'fade' | 'slide' | 'zoom' | 'none';
  animationDuration: number; // in ms
  defaultImageDuration: number; // in seconds
  autoRunOnBoot: boolean;
  autoStartPlayback: boolean;
  screenWakeLock: boolean;
  pinEnabled: boolean;
  pin: string;
  requirePinOnStartup: boolean;
  requirePinOnSettings: boolean;
  theme: 'dark' | 'light';
}

export const defaultSettings: AppSettings = {
  orientation: 'landscape',
  animation: 'fade',
  animationDuration: 500,
  defaultImageDuration: 10,
  autoRunOnBoot: false,
  autoStartPlayback: false,
  screenWakeLock: true,
  pinEnabled: false,
  pin: '',
  requirePinOnStartup: false,
  requirePinOnSettings: false,
  theme: 'dark',
};
