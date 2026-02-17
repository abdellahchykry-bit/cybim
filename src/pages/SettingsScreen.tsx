import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Monitor, 
  Sparkles, 
  PlayCircle, 
  Clock, 
  Lock, 
  Sun, 
  Moon,
  RotateCcw,
  RotateCw
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { TVButton } from '@/components/ui/tv-button';
import { TVCard, TVCardTitle, TVCardContent } from '@/components/ui/tv-card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AppSettings } from '@/types/campaign';
import { useState } from 'react';

const IMAGE_DURATION_OPTIONS = [5, 10, 15, 20, 25, 30, 60];
const TRANSITION_DURATION_OPTIONS = [100, 300, 500, 700, 1000, 1500, 2000];

const ORIENTATION_OPTIONS: { value: AppSettings['orientation']; label: string; icon: 'landscape' | 'portrait' }[] = [
  { value: 'landscape', label: 'Landscape', icon: 'landscape' },
  { value: 'landscape-inverted', label: 'Landscape (Inverted)', icon: 'landscape' },
  { value: 'portrait', label: 'Portrait', icon: 'portrait' },
  { value: 'portrait-inverted', label: 'Portrait (Inverted)', icon: 'portrait' },
];

const ANIMATION_OPTIONS: { value: AppSettings['animation']; label: string }[] = [
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'none', label: 'None' },
];

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { settings, setSettings, setPreviewOrientation } = useApp();
  const [pinDialog, setPinDialog] = useState<{ open: boolean; action: 'enable' | 'disable' | 'change' }>({
    open: false,
    action: 'enable',
  });
  const [newPin, setNewPin] = useState('');

  // Apply preview orientation when settings.orientation changes
  useEffect(() => {
    setPreviewOrientation(settings.orientation);
  }, [settings.orientation, setPreviewOrientation]);

  // Cleanup: revert to saved orientation when leaving
  useEffect(() => {
    return () => {
      setPreviewOrientation(null);
    };
  }, [setPreviewOrientation]);

  // Auto-save helper
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePinAction = () => {
    if (pinDialog.action === 'disable') {
      setSettings(prev => ({
        ...prev,
        pinEnabled: false,
        pin: '',
        requirePinOnStartup: false,
        requirePinOnSettings: false,
      }));
    } else if (newPin.length >= 4 && newPin.length <= 6) {
      setSettings(prev => ({
        ...prev,
        pinEnabled: true,
        pin: newPin,
      }));
    }
    setPinDialog({ open: false, action: 'enable' });
    setNewPin('');
  };

  return (
    <div className="min-h-screen pb-8">
      <NavigationBar />
      
      <main className="container mx-auto px-8 pt-24">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display text-4xl font-bold tracking-wide">Settings</h1>
          <p className="mt-2 text-muted-foreground">Configure your CYBIM signage player</p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Theme */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <TVCard focusable={false}>
              <TVCardTitle className="flex items-center gap-2">
                {settings.theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-primary" />
                )}
                Theme
              </TVCardTitle>
              <TVCardContent>
                <div className="flex gap-4">
                  <TVButton
                    variant={settings.theme === 'dark' ? 'default' : 'secondary'}
                    onClick={() => updateSetting('theme', 'dark')}
                    className="flex-1"
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </TVButton>
                  <TVButton
                    variant={settings.theme === 'light' ? 'default' : 'secondary'}
                    onClick={() => updateSetting('theme', 'light')}
                    className="flex-1"
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </TVButton>
                </div>
              </TVCardContent>
            </TVCard>
          </motion.div>

          {/* Screen Orientation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <TVCard focusable={false}>
              <TVCardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Screen Orientation
              </TVCardTitle>
              <TVCardContent>
                <div className="grid grid-cols-1 gap-2">
                  {ORIENTATION_OPTIONS.map((option) => (
                    <TVButton
                      key={option.value}
                      variant={settings.orientation === option.value ? 'default' : 'secondary'}
                      className="w-full justify-start"
                      onClick={() => updateSetting('orientation', option.value)}
                    >
                      {option.icon === 'landscape' ? (
                        <Monitor className="h-4 w-4 mr-2" />
                      ) : (
                        <RotateCcw className="h-4 w-4 mr-2" />
                      )}
                      {option.label}
                    </TVButton>
                  ))}
                </div>
              </TVCardContent>
            </TVCard>
          </motion.div>

          {/* Animation Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <TVCard focusable={false}>
              <TVCardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Animation
              </TVCardTitle>
              <TVCardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Transition Effect</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ANIMATION_OPTIONS.map((option) => (
                      <TVButton
                        key={option.value}
                        variant={settings.animation === option.value ? 'default' : 'secondary'}
                        onClick={() => updateSetting('animation', option.value)}
                      >
                        {option.label}
                      </TVButton>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Transition Duration</Label>
                  <div className="flex flex-wrap gap-2">
                    {TRANSITION_DURATION_OPTIONS.map((duration) => (
                      <TVButton
                        key={duration}
                        variant={settings.animationDuration === duration ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => updateSetting('animationDuration', duration)}
                      >
                        {duration >= 1000 ? `${duration / 1000}s` : `${duration}ms`}
                      </TVButton>
                    ))}
                  </div>
                </div>
              </TVCardContent>
            </TVCard>
          </motion.div>

          {/* Playback Defaults */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <TVCard focusable={false}>
              <TVCardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-primary" />
                Playback
              </TVCardTitle>
              <TVCardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Default Image Duration</Label>
                  <div className="flex flex-wrap gap-2">
                    {IMAGE_DURATION_OPTIONS.map((duration) => (
                      <TVButton
                        key={duration}
                        variant={settings.defaultImageDuration === duration ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => updateSetting('defaultImageDuration', duration)}
                      >
                        {duration}s
                      </TVButton>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Loop</Label>
                    <p className="text-xs text-muted-foreground">Repeat campaigns continuously</p>
                  </div>
                  <Switch
                    checked={settings.loop}
                    onCheckedChange={(checked) => updateSetting('loop', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-play</Label>
                    <p className="text-xs text-muted-foreground">Start when app launches</p>
                  </div>
                  <Switch
                    checked={settings.autoPlay}
                    onCheckedChange={(checked) => updateSetting('autoPlay', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-start Playback</Label>
                    <p className="text-xs text-muted-foreground">Play on app launch</p>
                  </div>
                  <Switch
                    checked={settings.autoStartPlayback}
                    onCheckedChange={(checked) => updateSetting('autoStartPlayback', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Screen Wake Lock</Label>
                    <p className="text-xs text-muted-foreground">Keep screen on</p>
                  </div>
                  <Switch
                    checked={settings.screenWakeLock}
                    onCheckedChange={(checked) => updateSetting('screenWakeLock', checked)}
                  />
                </div>
              </TVCardContent>
            </TVCard>
          </motion.div>

          {/* App Lock (PIN) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <TVCard focusable={false}>
              <TVCardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                App Lock (PIN)
              </TVCardTitle>
              <TVCardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>PIN Protection</Label>
                  <Switch
                    checked={settings.pinEnabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPinDialog({ open: true, action: 'enable' });
                      } else {
                        setPinDialog({ open: true, action: 'disable' });
                      }
                    }}
                  />
                </div>
                {settings.pinEnabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label>Require on Startup</Label>
                      <Switch
                        checked={settings.requirePinOnStartup}
                        onCheckedChange={(checked) => updateSetting('requirePinOnStartup', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Require for Settings</Label>
                      <Switch
                        checked={settings.requirePinOnSettings}
                        onCheckedChange={(checked) => updateSetting('requirePinOnSettings', checked)}
                      />
                    </div>
                    <TVButton
                      variant="secondary"
                      className="w-full"
                      onClick={() => setPinDialog({ open: true, action: 'change' })}
                    >
                      Change PIN
                    </TVButton>
                  </>
                )}
              </TVCardContent>
            </TVCard>
          </motion.div>

          {/* Date & Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <TVCard focusable={false}>
              <TVCardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Date & Time
              </TVCardTitle>
              <TVCardContent>
                <p className="text-sm text-muted-foreground">
                  Date and time are managed by the system. For Android TV, adjust in system settings.
                </p>
              </TVCardContent>
            </TVCard>
          </motion.div>
        </div>
      </main>

      {/* PIN Dialog */}
      <ConfirmDialog
        open={pinDialog.open}
        onOpenChange={(open) => {
          setPinDialog({ ...pinDialog, open });
          setNewPin('');
        }}
        title={
          pinDialog.action === 'disable'
            ? 'Disable PIN'
            : pinDialog.action === 'change'
            ? 'Change PIN'
            : 'Set PIN'
        }
        description={
          pinDialog.action === 'disable'
            ? 'Are you sure you want to disable PIN protection?'
            : 'Enter a 4-6 digit PIN:'
        }
        confirmText={pinDialog.action === 'disable' ? 'Disable' : 'Set PIN'}
        onConfirm={handlePinAction}
        variant={pinDialog.action === 'disable' ? 'destructive' : 'default'}
      >
        {pinDialog.action !== 'disable' && (
          <Input
            type="password"
            maxLength={6}
            minLength={4}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter PIN (4-6 digits)"
            className="mt-4 h-12 bg-secondary border-border text-center text-2xl tracking-widest"
          />
        )}
      </ConfirmDialog>
    </div>
  );
}
