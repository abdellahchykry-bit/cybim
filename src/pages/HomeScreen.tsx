import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Play, Trash2, Film, Clock, Youtube, Image as ImageIcon, Video } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '@/contexts/AppContext';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { DateTimeDisplay } from '@/components/layout/DateTimeDisplay';
import { TVButton } from '@/components/ui/tv-button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Campaign } from '@/types/campaign';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HomeScreen() {
  const navigate = useNavigate();
  const { campaigns, setCampaigns, currentTime, isDataLoaded } = useApp();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; campaign: Campaign | null }>({
    open: false,
    campaign: null,
  });

  // Show loading state while data loads
  if (!isDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  const isCampaignActive = (campaign: Campaign) => {
    if (campaign.mediaItems.length === 0) return false;
    if (!campaign.schedule.enabled) return true;
    
    const now = currentTime;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay();
    
    if (campaign.schedule.days && campaign.schedule.days.length > 0) {
      if (!campaign.schedule.days.includes(currentDay)) return false;
    }
    
    const [startH, startM] = campaign.schedule.startTime.split(':').map(Number);
    const [endH, endM] = campaign.schedule.endTime.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };

  const getCountdown = (campaign: Campaign) => {
    if (!campaign.schedule.enabled) return null;
    if (campaign.mediaItems.length === 0) return null;
    if (isCampaignActive(campaign)) return null;
    
    const now = currentTime;
    const currentDay = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = campaign.schedule.startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    
    const scheduledDays = campaign.schedule.days && campaign.schedule.days.length > 0 
      ? campaign.schedule.days 
      : [0, 1, 2, 3, 4, 5, 6];
    
    let daysUntilNext = 0;
    
    for (let i = 0; i <= 7; i++) {
      const checkDay = (currentDay + i) % 7;
      if (scheduledDays.includes(checkDay)) {
        if (i === 0 && currentMinutes < startMinutes) {
          daysUntilNext = 0;
          break;
        } else if (i > 0) {
          daysUntilNext = i;
          break;
        }
      }
    }
    
    let totalMinutesUntilStart = daysUntilNext * 24 * 60 + (startMinutes - currentMinutes);
    if (daysUntilNext > 0) {
      totalMinutesUntilStart = daysUntilNext * 24 * 60 - currentMinutes + startMinutes;
    }
    
    if (totalMinutesUntilStart <= 0) return null;
    
    const days = Math.floor(totalMinutesUntilStart / (24 * 60));
    const hours = Math.floor((totalMinutesUntilStart % (24 * 60)) / 60);
    const minutes = totalMinutesUntilStart % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleDeleteCampaign = () => {
    if (deleteDialog.campaign) {
      setCampaigns(campaigns.filter((c) => c.id !== deleteDialog.campaign!.id));
      setDeleteDialog({ open: false, campaign: null });
    }
  };

  const handleCreateCampaign = () => {
    // Auto-generate name
    const existingNumbers = campaigns
      .map(c => {
        const match = c.name.match(/^Campaign (\d+)$/);
        return match ? parseInt(match[1]) : 0;
      });
    const nextNumber = Math.max(0, ...existingNumbers) + 1;
    
    const newCampaign: Campaign = {
      id: uuidv4(),
      name: `Campaign ${nextNumber}`,
      mediaItems: [],
      schedule: {
        startTime: '09:00',
        endTime: '18:00',
        days: [1, 2, 3, 4, 5],
        enabled: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setCampaigns(prev => [...prev, newCampaign]);
    navigate(`/campaign/${newCampaign.id}`);
  };

  // Get first image thumbnail from campaign
  const getCampaignThumbnail = (campaign: Campaign) => {
    const firstImage = campaign.mediaItems.find(m => m.type === 'image');
    return firstImage?.url || null;
  };

  const openYouTube = () => {
    window.open('https://www.youtube.com', '_blank');
  };

  return (
    <div className="min-h-screen pb-8">
      <NavigationBar />
      
      <main className="container mx-auto px-8 pt-24">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <motion.h1
              className="font-display text-4xl font-bold tracking-wide"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Dashboard
            </motion.h1>
            <motion.p
              className="mt-2 text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              Manage your digital signage campaigns
            </motion.p>
          </div>
          
          <DateTimeDisplay />
        </div>

        {/* Action Buttons */}
        <motion.div
          className="mb-8 flex flex-wrap gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <TVButton size="lg" onClick={handleCreateCampaign}>
            <Plus className="h-5 w-5" />
            Create Campaign
          </TVButton>
          <TVButton
            variant="secondary"
            size="lg"
            onClick={() => navigate('/play')}
            disabled={campaigns.length === 0}
          >
            <Play className="h-5 w-5" />
            Play Campaigns
          </TVButton>
          <TVButton
            size="lg"
            onClick={openYouTube}
            className="bg-[#FF0000] hover:bg-[#CC0000] text-white border-none"
          >
            <Youtube className="h-5 w-5" />
            YouTube
          </TVButton>
        </motion.div>

        {/* Campaigns Grid */}
        {campaigns.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-24 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="mb-6 rounded-full bg-secondary p-6">
              <Film className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="font-display text-2xl font-bold">No Campaigns Yet</h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              Create your first campaign to start displaying content on your digital signage.
            </p>
            <TVButton className="mt-6" onClick={handleCreateCampaign}>
              <Plus className="h-5 w-5" />
              Create Your First Campaign
            </TVButton>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign, index) => {
              const isActive = isCampaignActive(campaign);
              const countdown = getCountdown(campaign);
              const thumbnail = getCampaignThumbnail(campaign);
              
              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                >
                  <div
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                    className="group relative cursor-pointer rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 tv-focus"
                    tabIndex={0}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-40 w-full bg-secondary overflow-hidden">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={campaign.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          {campaign.mediaItems.length > 0 ? (
                            <Video className="h-12 w-12 text-muted-foreground/50" />
                          ) : (
                            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                          )}
                        </div>
                      )}
                      
                      {/* Status badges */}
                      <div className="absolute top-3 right-3 flex gap-2">
                        {isActive && (
                          <span className="flex items-center gap-1.5 rounded-full bg-success px-3 py-1 text-xs font-bold text-success-foreground shadow-lg shadow-success/30">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-success-foreground" />
                            LIVE
                          </span>
                        )}
                        {countdown && (
                          <span className="flex items-center gap-1 rounded-full bg-warning/20 px-3 py-1 text-xs font-medium text-warning">
                            <Clock className="h-3 w-3" />
                            {countdown}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-display text-lg font-bold truncate">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {campaign.mediaItems.length} item{campaign.mediaItems.length !== 1 ? 's' : ''}
                        {campaign.schedule.enabled && (
                          <span className="ml-2">
                            • {campaign.schedule.startTime} - {campaign.schedule.endTime}
                            {campaign.schedule.days && campaign.schedule.days.length > 0 && campaign.schedule.days.length < 7 && (
                              <span className="ml-1 text-xs">
                                ({campaign.schedule.days.map(d => DAY_NAMES[d]).join(', ')})
                              </span>
                            )}
                          </span>
                        )}
                      </p>

                      {/* Delete button */}
                      <div className="mt-3 flex justify-end">
                        <TVButton
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog({ open: true, campaign });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </TVButton>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, campaign: deleteDialog.campaign })}
        title="Delete Campaign"
        description={`Are you sure you want to delete "${deleteDialog.campaign?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteCampaign}
        variant="destructive"
      />
    </div>
  );
}
