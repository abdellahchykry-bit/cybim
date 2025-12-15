import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Play, Settings, Info, Eye, Trash2, Film, Clock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { NavigationBar } from '@/components/layout/NavigationBar';
import { DateTimeDisplay } from '@/components/layout/DateTimeDisplay';
import { TVButton } from '@/components/ui/tv-button';
import { TVCard, TVCardTitle, TVCardDescription, TVCardContent } from '@/components/ui/tv-card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Campaign } from '@/types/campaign';

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
    
    const [startH, startM] = campaign.schedule.startTime.split(':').map(Number);
    const [endH, endM] = campaign.schedule.endTime.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };

  const getCountdown = (campaign: Campaign) => {
    if (!campaign.schedule.enabled) return null;
    
    const now = currentTime;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = campaign.schedule.startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    
    if (currentMinutes >= startMinutes) return null;
    
    const diff = startMinutes - currentMinutes;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const handleDeleteCampaign = () => {
    if (deleteDialog.campaign) {
      setCampaigns(campaigns.filter((c) => c.id !== deleteDialog.campaign!.id));
      setDeleteDialog({ open: false, campaign: null });
    }
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
                        <span className="flex items-center gap-1 rounded-full bg-success/20 px-3 py-1 text-xs font-medium text-success">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {campaign.schedule.enabled && (
                          <span>
                            {campaign.schedule.startTime} - {campaign.schedule.endTime}
                          </span>
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
