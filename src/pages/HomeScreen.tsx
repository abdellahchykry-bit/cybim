import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Play, Settings, Info, Eye, Trash2, Copy, Film, Clock, Youtube } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '@/contexts/AppContext';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { DateTimeDisplay } from '@/components/layout/DateTimeDisplay';
import { TVButton } from '@/components/ui/tv-button';
import { TVCard, TVCardTitle, TVCardDescription, TVCardContent } from '@/components/ui/tv-card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Campaign } from '@/types/campaign';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HomeScreen() {
  const navigate = useNavigate();
  const { campaigns, setCampaigns, currentTime } = useApp();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; campaign: Campaign | null }>({
    open: false,
    campaign: null,
  });

  const isCampaignActive = (campaign: Campaign) => {
    if (!campaign.schedule.enabled) return false;
    
    const now = currentTime;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay();
    
    // Check if current day is in schedule
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
    if (isCampaignActive(campaign)) return null;
    
    const now = currentTime;
    const currentDay = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = campaign.schedule.startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    
    const scheduledDays = campaign.schedule.days && campaign.schedule.days.length > 0 
      ? campaign.schedule.days 
      : [0, 1, 2, 3, 4, 5, 6];
    
    // Find next scheduled day
    let daysUntilNext = 0;
    let nextDay = currentDay;
    
    for (let i = 0; i <= 7; i++) {
      const checkDay = (currentDay + i) % 7;
      if (scheduledDays.includes(checkDay)) {
        if (i === 0 && currentMinutes < startMinutes) {
          // Today, but start time hasn't passed
          daysUntilNext = 0;
          nextDay = checkDay;
          break;
        } else if (i > 0) {
          daysUntilNext = i;
          nextDay = checkDay;
          break;
        }
      }
    }
    
    // Calculate total minutes until start
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

  const handleDuplicateCampaign = (campaign: Campaign, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicatedCampaign: Campaign = {
      ...campaign,
      id: uuidv4(),
      name: `${campaign.name} (copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCampaigns([...campaigns, duplicatedCampaign]);
  };

  const openYouTube = () => {
    // Try to open YouTube app on Android TV, fallback to web
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
              Campaign Dashboard
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
          <TVButton size="lg" onClick={() => navigate('/campaign/new')}>
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
            variant="outline"
            size="lg"
            onClick={openYouTube}
          >
            <Youtube className="h-5 w-5" />
            YouTube
          </TVButton>
          <TVButton
            variant="ghost"
            size="lg"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-5 w-5" />
            Settings
          </TVButton>
          <TVButton
            variant="ghost"
            size="lg"
            onClick={() => navigate('/about')}
          >
            <Info className="h-5 w-5" />
            About
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
            <TVButton className="mt-6" onClick={() => navigate('/campaign/new')}>
              <Plus className="h-5 w-5" />
              Create Your First Campaign
            </TVButton>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign, index) => {
              const isActive = isCampaignActive(campaign);
              const countdown = getCountdown(campaign);
              
              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                >
                  <TVCard
                    onClick={() => navigate(`/campaign/${campaign.id}`)}
                    className="relative"
                  >
                    {/* Status badges */}
                    <div className="absolute top-4 right-4 flex gap-2">
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

                    <TVCardTitle>{campaign.name}</TVCardTitle>
                    <TVCardDescription>
                      {campaign.mediaItems.length} item{campaign.mediaItems.length !== 1 ? 's' : ''}
                    </TVCardDescription>

                    <TVCardContent>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {campaign.schedule.enabled && (
                          <>
                            <span>
                              {campaign.schedule.startTime} - {campaign.schedule.endTime}
                            </span>
                            {campaign.schedule.days && campaign.schedule.days.length > 0 && campaign.schedule.days.length < 7 && (
                              <span className="text-xs">
                                ({campaign.schedule.days.map(d => DAY_NAMES[d]).join(', ')})
                              </span>
                            )}
                          </>
                        )}
                        {campaign.loop && (
                          <span className="rounded bg-secondary px-2 py-0.5 text-xs">
                            Loop
                          </span>
                        )}
                        {campaign.autoPlay && (
                          <span className="rounded bg-primary/20 px-2 py-0.5 text-xs text-primary">
                            Auto
                          </span>
                        )}
                      </div>
                    </TVCardContent>

                    {/* Quick actions */}
                    <div className="mt-4 flex gap-2 border-t border-border pt-4">
                      <TVButton
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/preview/${campaign.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </TVButton>
                      <TVButton
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDuplicateCampaign(campaign, e)}
                      >
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </TVButton>
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
                  </TVCard>
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