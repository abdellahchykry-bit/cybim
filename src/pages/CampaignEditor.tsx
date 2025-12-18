import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { 
  Upload, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Copy, 
  Image as ImageIcon, 
  Video, 
  Save,
  Clock,
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
import { TimeInput } from '@/components/ui/time-input';
import { Campaign, MediaItem } from '@/types/campaign';
import { toast } from '@/hooks/use-toast';

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export default function CampaignEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { campaigns, setCampaigns, settings } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNew = id === 'new';
  const existingCampaign = campaigns.find((c) => c.id === id);

  const [campaign, setCampaign] = useState<Campaign>(() => {
    if (existingCampaign) return { ...existingCampaign };
    return {
      id: uuidv4(),
      name: '',
      mediaItems: [],
      schedule: {
        startTime: '09:00',
        endTime: '18:00',
        days: [1, 2, 3, 4, 5], // Mon-Fri by default
        enabled: false,
      },
      loop: true,
      autoPlay: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [deleteItemDialog, setDeleteItemDialog] = useState<{ open: boolean; itemId: string | null }>({
    open: false,
    itemId: null,
  });

  useEffect(() => {
    if (!isNew && !existingCampaign) {
      navigate('/home');
    }
  }, [isNew, existingCampaign, navigate]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const filePromises = Array.from(files).map((file) => {
      return new Promise<MediaItem | null>((resolve) => {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isVideo && !isImage) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            id: uuidv4(),
            name: file.name,
            type: isVideo ? 'video' : 'image',
            url: reader.result as string,
            duration: isImage ? settings.defaultImageDuration : undefined,
          });
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    });

    const newItems = (await Promise.all(filePromises)).filter((item): item is MediaItem => item !== null);

    if (newItems.length > 0) {
      setCampaign((prev) => ({
        ...prev,
        mediaItems: [...prev.mediaItems, ...newItems],
        updatedAt: new Date(),
      }));
      setUnsavedChanges(true);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...campaign.mediaItems];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newItems.length) return;
    
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    
    setCampaign((prev) => ({ ...prev, mediaItems: newItems, updatedAt: new Date() }));
    setUnsavedChanges(true);
  };

  const duplicateItem = (item: MediaItem) => {
    const duplicate: MediaItem = {
      ...item,
      id: uuidv4(),
      name: `${item.name} (copy)`,
    };
    
    setCampaign((prev) => ({
      ...prev,
      mediaItems: [...prev.mediaItems, duplicate],
      updatedAt: new Date(),
    }));
    setUnsavedChanges(true);
  };

  const deleteItem = () => {
    if (!deleteItemDialog.itemId) return;
    
    setCampaign((prev) => ({
      ...prev,
      mediaItems: prev.mediaItems.filter((item) => item.id !== deleteItemDialog.itemId),
      updatedAt: new Date(),
    }));
    setDeleteItemDialog({ open: false, itemId: null });
    setUnsavedChanges(true);
  };

  const toggleDay = (day: number) => {
    setCampaign((prev) => {
      const currentDays = prev.schedule.days || [];
      const newDays = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day].sort((a, b) => a - b);
      return {
        ...prev,
        schedule: { ...prev.schedule, days: newDays },
      };
    });
    setUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!campaign.name.trim()) {
      toast({
        title: 'Campaign name required',
        description: 'Please enter a name for your campaign.',
        variant: 'destructive',
      });
      return;
    }

    const updatedCampaign = { ...campaign, updatedAt: new Date() };
    
    if (isNew) {
      setCampaigns((prev) => [...prev, updatedCampaign]);
    } else {
      setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? updatedCampaign : c)));
    }

    setUnsavedChanges(false);
    toast({
      title: 'Campaign saved',
      description: `"${campaign.name}" has been saved successfully.`,
    });
    navigate('/home');
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
          <h1 className="font-display text-4xl font-bold tracking-wide">
            {isNew ? 'Create Campaign' : 'Edit Campaign'}
          </h1>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <TVCard focusable={false}>
                <TVCardTitle>Campaign Name</TVCardTitle>
                <TVCardContent>
                  <Input
                    value={campaign.name}
                    onChange={(e) => {
                      setCampaign((prev) => ({ ...prev, name: e.target.value }));
                      setUnsavedChanges(true);
                    }}
                    placeholder="Enter campaign name..."
                    className="h-14 text-lg font-medium bg-secondary border-border tv-focus"
                  />
                </TVCardContent>
              </TVCard>
            </motion.div>

            {/* Media Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <TVCard focusable={false}>
                <TVCardTitle>Media Selection</TVCardTitle>
                <TVCardContent>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <TVButton
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-5 w-5" />
                    Upload Media Files
                  </TVButton>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Supports images and videos. Select multiple files to add in bulk.
                  </p>
                </TVCardContent>
              </TVCard>
            </motion.div>

            {/* Media List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <TVCard focusable={false}>
                <TVCardTitle>Campaign Content ({campaign.mediaItems.length} items)</TVCardTitle>
                <TVCardContent>
                  {campaign.mediaItems.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <ImageIcon className="mx-auto mb-3 h-12 w-12 opacity-50" />
                      <p>No media added yet. Upload files to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {campaign.mediaItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 rounded-lg bg-secondary/50 p-4"
                        >
                          {/* Thumbnail */}
                          <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                            {item.type === 'image' ? (
                              <img
                                src={item.url}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Video className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {item.type}
                              {item.type === 'image' && item.duration && ` • ${item.duration}s`}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <TVButton
                              variant="ghost"
                              size="icon"
                              onClick={() => moveItem(index, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </TVButton>
                            <TVButton
                              variant="ghost"
                              size="icon"
                              onClick={() => moveItem(index, 'down')}
                              disabled={index === campaign.mediaItems.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </TVButton>
                            <TVButton
                              variant="ghost"
                              size="icon"
                              onClick={() => duplicateItem(item)}
                            >
                              <Copy className="h-4 w-4" />
                            </TVButton>
                            <TVButton
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteItemDialog({ open: true, itemId: item.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </TVButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TVCardContent>
              </TVCard>
            </motion.div>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            {/* Schedule */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <TVCard focusable={false}>
                <TVCardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Schedule
                </TVCardTitle>
                <TVCardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Schedule</Label>
                    <Switch
                      checked={campaign.schedule.enabled}
                      onCheckedChange={(checked) => {
                        setCampaign((prev) => ({
                          ...prev,
                          schedule: { ...prev.schedule, enabled: checked },
                        }));
                        setUnsavedChanges(true);
                      }}
                    />
                  </div>
                  {campaign.schedule.enabled && (
                    <>
                      <div>
                        <Label className="mb-2 block">Days of Week</Label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS.map((day) => (
                            <button
                              key={day.value}
                              onClick={() => toggleDay(day.value)}
                              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors tv-focus ${
                                (campaign.schedule.days || []).includes(day.value)
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                              }`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="mb-2 block">Start Time (24h)</Label>
                        <TimeInput
                          value={campaign.schedule.startTime}
                          onChange={(value) => {
                            setCampaign((prev) => ({
                              ...prev,
                              schedule: { ...prev.schedule, startTime: value },
                            }));
                            setUnsavedChanges(true);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block">End Time (24h)</Label>
                        <TimeInput
                          value={campaign.schedule.endTime}
                          onChange={(value) => {
                            setCampaign((prev) => ({
                              ...prev,
                              schedule: { ...prev.schedule, endTime: value },
                            }));
                            setUnsavedChanges(true);
                          }}
                          error={
                            campaign.schedule.endTime < campaign.schedule.startTime
                              ? 'End time must be after start time'
                              : undefined
                          }
                        />
                      </div>
                    </>
                  )}
                </TVCardContent>
              </TVCard>
            </motion.div>

            {/* Playback Options */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <TVCard focusable={false}>
                <TVCardTitle className="flex items-center gap-2">
                  <RotateCw className="h-5 w-5 text-primary" />
                  Playback
                </TVCardTitle>
                <TVCardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Loop</Label>
                    <Switch
                      checked={campaign.loop}
                      onCheckedChange={(checked) => {
                        setCampaign((prev) => ({ ...prev, loop: checked }));
                        setUnsavedChanges(true);
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-play</Label>
                      <p className="text-xs text-muted-foreground">Start when app launches</p>
                    </div>
                    <Switch
                      checked={campaign.autoPlay}
                      onCheckedChange={(checked) => {
                        setCampaign((prev) => ({ ...prev, autoPlay: checked }));
                        setUnsavedChanges(true);
                      }}
                    />
                  </div>
                </TVCardContent>
              </TVCard>
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <TVButton
                size="xl"
                className="w-full"
                onClick={handleSave}
              >
                <Save className="h-5 w-5" />
                {isNew ? 'Create Campaign' : 'Save Changes'}
              </TVButton>
              {unsavedChanges && (
                <p className="mt-2 text-center text-sm text-warning">
                  You have unsaved changes
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      {/* Delete Item Dialog */}
      <ConfirmDialog
        open={deleteItemDialog.open}
        onOpenChange={(open) => setDeleteItemDialog({ open, itemId: deleteItemDialog.itemId })}
        title="Delete Media Item"
        description="Are you sure you want to remove this item from the campaign?"
        confirmText="Delete"
        onConfirm={deleteItem}
        variant="destructive"
      />
    </div>
  );
}