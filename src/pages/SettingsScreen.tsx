import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Monitor, 
  Sparkles, 
  PlayCircle, 
  Clock, 
  Lock, 
  Sun, 
  Moon,
  Shield
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { TVButton } from '@/components/ui/tv-button';
import { TVCard, TVCardTitle, TVCardContent } from '@/components/ui/tv-card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const IMAGE_DURATION_OPTIONS = [5, 10, 15, 20, 25, 30, 60];
const TRANSITION_DURATION_OPTIONS = [300, 500, 700, 1000, 1500, 2000];

export default function SettingsScreen() {
  const { settings, setSettings } = useApp();
  const [pendingSettings, setPendingSettings] = useState(settings);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [pinDialog, setPinDialog] = useState<{ open: boolean; action: 'enable' | 'disable' | 'change' }>({
    open: false,
    action: 'enable',
  });
  const [newPin, setNewPin] = useState('');

  const handleSaveSettings = () => {
    setSettings(pendingSettings);
    setConfirmDialog(false);
    toast({
      title: 'Settings saved',
      description: 'Your settings have been updated successfully.',
    });
  };

  const handlePinAction = () => {
    if (pinDialog.action === 'disable') {
      setPendingSettings((prev) => ({
        ...prev,
        pinEnabled: false,
        pin: '',
        requirePinOnStartup: false,
        requirePinOnSettings: false,
      }));
    } else if (newPin.length >= 4 && newPin.length <= 6) {
      setPendingSettings((prev) => ({
        ...prev,
        pinEnabled: true,
        pin: newPin,
      }));
    }
    setPinDialog({ open: false, action: 'enable' });
    setNewPin('');
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(pendingSettings);

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
                {pendingSettings.theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-primary" />
                )}
                Theme
              </TVCardTitle>
              <TVCardContent>
                <div className="flex gap-4">
                  <TVButton
                    variant={pendingSettings.theme === 'dark' ? 'default' : 'secondary'}
                    onClick={() => setPendingSettings((prev) => ({ ...prev, theme: 'dark' }))}
                    className="flex-1"
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </TVButton>
                  <TVButton
                    variant={pendingSettings.theme === 'light' ? 'default' : 'secondary'}
                    onClick={() => setPendingSettings((prev) => ({ ...prev, theme: 'light' }))}
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
                <Select
                  value={pendingSettings.orientation}
                  onValueChange={(value: typeof pendingSettings.orientation) =>
                    setPendingSettings((prev) => ({ ...prev, orientation: value }))
                  }
                >
                  <SelectTrigger className="h-12 bg-secondary border-border tv-focus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="landscape">Landscape</SelectItem>
                    <SelectItem value="landscape-inverted">Landscape (Inverted)</SelectItem>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="portrait-inverted">Portrait (Inverted)</SelectItem>
                  </SelectContent>
                </Select>
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
                  <Select
                    value={pendingSettings.animation}
                    onValueChange={(value: typeof pendingSettings.animation) =>
                      setPendingSettings((prev) => ({ ...prev, animation: value }))
                    }
                  >
                    <SelectTrigger className="h-12 bg-secondary border-border tv-focus">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Transition Duration</Label>
                  <div className="flex flex-wrap gap-2">
                    {TRANSITION_DURATION_OPTIONS.map((duration) => (
                      <TVButton
                        key={duration}
                        variant={pendingSettings.animationDuration === duration ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() =>
                          setPendingSettings((prev) => ({ ...prev, animationDuration: duration }))
                        }
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
                Playback Defaults
              </TVCardTitle>
              <TVCardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Default Image Duration</Label>
                  <div className="flex flex-wrap gap-2">
                    {IMAGE_DURATION_OPTIONS.map((duration) => (
                      <TVButton
                        key={duration}
                        variant={pendingSettings.defaultImageDuration === duration ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() =>
                          setPendingSettings((prev) => ({ ...prev, defaultImageDuration: duration }))
                        }
                      >
                        {duration}s
                      </TVButton>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-start Playback</Label>
                    <p className="text-xs text-muted-foreground">Play on app launch</p>
                  </div>
                  <Switch
                    checked={pendingSettings.autoStartPlayback}
                    onCheckedChange={(checked) =>
                      setPendingSettings((prev) => ({ ...prev, autoStartPlayback: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Screen Wake Lock</Label>
                    <p className="text-xs text-muted-foreground">Keep screen on</p>
                  </div>
                  <Switch
                    checked={pendingSettings.screenWakeLock}
                    onCheckedChange={(checked) =>
                      setPendingSettings((prev) => ({ ...prev, screenWakeLock: checked }))
                    }
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
                    checked={pendingSettings.pinEnabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPinDialog({ open: true, action: 'enable' });
                      } else {
                        setPinDialog({ open: true, action: 'disable' });
                      }
                    }}
                  />
                </div>
                {pendingSettings.pinEnabled && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label>Require on Startup</Label>
                      <Switch
                        checked={pendingSettings.requirePinOnStartup}
                        onCheckedChange={(checked) =>
                          setPendingSettings((prev) => ({ ...prev, requirePinOnStartup: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Require for Settings</Label>
                      <Switch
                        checked={pendingSettings.requirePinOnSettings}
                        onCheckedChange={(checked) =>
                          setPendingSettings((prev) => ({ ...prev, requirePinOnSettings: checked }))
                        }
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

        {/* Save Button */}
        <motion.div
          className="mt-8 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <TVButton
            size="xl"
            onClick={() => setConfirmDialog(true)}
            disabled={!hasChanges}
            className="min-w-64"
          >
            <Shield className="h-5 w-5" />
            Confirm Changes
          </TVButton>
        </motion.div>
        {hasChanges && (
          <p className="mt-3 text-center text-sm text-warning">
            You have unsaved changes
          </p>
        )}
      </main>

      {/* Confirm Save Dialog */}
      <ConfirmDialog
        open={confirmDialog}
        onOpenChange={setConfirmDialog}
        title="Save Settings"
        description="Are you sure you want to save these settings?"
        confirmText="Save"
        onConfirm={handleSaveSettings}
      />

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
