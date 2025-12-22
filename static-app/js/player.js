/**
 * CYBIM Media Player Module
 * Handles image/video playback with dual-player system
 * 100% Offline - No network requests
 */

const Player = {
    // State
    isPlaying: false,
    campaigns: [],
    currentCampaignIndex: 0,
    currentItemIndex: 0,
    activePlayer: 'A', // 'A' or 'B'
    imageTimer: null,
    tapCount: 0,
    tapTimeout: null,

    // DOM Elements
    container: null,
    image: null,
    videoA: null,
    videoB: null,
    overlay: null,

    // Initialize player
    init: function() {
        this.container = document.getElementById('player-container');
        this.image = document.getElementById('player-image');
        this.videoA = document.getElementById('player-video-a');
        this.videoB = document.getElementById('player-video-b');
        this.overlay = document.getElementById('player-overlay');

        // Video event listeners
        this.videoA.addEventListener('ended', () => this.handleVideoEnded('A'));
        this.videoB.addEventListener('ended', () => this.handleVideoEnded('B'));
        this.videoA.addEventListener('canplay', () => this.handleVideoReady('A'));
        this.videoB.addEventListener('canplay', () => this.handleVideoReady('B'));
        this.videoA.addEventListener('error', (e) => this.handleVideoError('A', e));
        this.videoB.addEventListener('error', (e) => this.handleVideoError('B', e));

        // Touch/click for exit
        document.getElementById('play-screen').addEventListener('click', () => this.handleTap());

        // Keyboard for exit
        document.addEventListener('keydown', (e) => {
            if (this.isPlaying && (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Back')) {
                this.stop();
            }
        });
    },

    // Start playback
    start: function(campaigns) {
        if (!campaigns || campaigns.length === 0) {
            console.log('No campaigns to play');
            return false;
        }

        // Filter active campaigns based on schedule
        this.campaigns = this.filterActiveCampaigns(campaigns);
        
        if (this.campaigns.length === 0) {
            console.log('No active campaigns at this time');
            return false;
        }

        this.currentCampaignIndex = 0;
        this.currentItemIndex = 0;
        this.activePlayer = 'A';
        this.isPlaying = true;

        // Reset media elements
        this.hideAllMedia();
        
        // Apply orientation
        const settings = Storage.getSettings();
        this.applyOrientation(settings.orientation);

        // Show play screen
        App.showScreen('play-screen');

        // Start playback
        this.playCurrentItem();
        
        return true;
    },

    // Stop playback
    stop: function() {
        this.isPlaying = false;
        this.clearImageTimer();
        
        // Stop videos
        this.videoA.pause();
        this.videoA.src = '';
        this.videoB.pause();
        this.videoB.src = '';
        
        // Hide media
        this.hideAllMedia();

        // Return to home
        App.showScreen('home-screen');
    },

    // Filter campaigns by schedule
    filterActiveCampaigns: function(campaigns) {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        return campaigns.filter(campaign => {
            if (!campaign.items || campaign.items.length === 0) {
                return false;
            }

            if (!campaign.schedule || !campaign.schedule.enabled) {
                return true;
            }

            // Check day
            if (!campaign.schedule.days.includes(currentDay)) {
                return false;
            }

            // Check time
            const [startH, startM] = campaign.schedule.startTime.split(':').map(Number);
            const [endH, endM] = campaign.schedule.endTime.split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;

            return currentTime >= startMinutes && currentTime <= endMinutes;
        });
    },

    // Play current item
    playCurrentItem: function() {
        if (!this.isPlaying) return;

        const campaign = this.campaigns[this.currentCampaignIndex];
        if (!campaign || !campaign.items || campaign.items.length === 0) {
            this.advanceToNext();
            return;
        }

        const item = campaign.items[this.currentItemIndex];
        if (!item) {
            this.advanceToNext();
            return;
        }

        // Preload next item
        this.preloadNext();

        if (item.type === 'image') {
            this.playImage(item);
        } else if (item.type === 'video') {
            this.playVideo(item);
        }
    },

    // Play image
    playImage: function(item) {
        this.hideAllMedia();
        this.clearImageTimer();

        this.image.src = item.src;
        this.image.classList.add('active');

        const campaign = this.campaigns[this.currentCampaignIndex];
        const duration = (item.duration || campaign.imageDuration || 5) * 1000;

        this.imageTimer = setTimeout(() => {
            if (this.isPlaying) {
                this.advanceToNext();
            }
        }, duration);
    },

    // Play video
    playVideo: function(item) {
        this.hideAllMedia();
        this.clearImageTimer();

        const video = this.activePlayer === 'A' ? this.videoA : this.videoB;
        
        video.src = item.src;
        video.muted = true;
        video.load();
    },

    // Handle video ready to play
    handleVideoReady: function(player) {
        if (!this.isPlaying) return;

        const video = player === 'A' ? this.videoA : this.videoB;
        
        if ((this.activePlayer === 'A' && player === 'A') ||
            (this.activePlayer === 'B' && player === 'B')) {
            video.classList.add('active');
            video.play().then(() => {
                // Try to unmute after play starts
                video.muted = false;
            }).catch(err => {
                console.log('Autoplay with audio failed, keeping muted:', err);
                video.muted = true;
                video.play().catch(() => {});
            });
        }
    },

    // Handle video ended
    handleVideoEnded: function(player) {
        if (!this.isPlaying) return;

        // Check if single looping video
        const campaign = this.campaigns[this.currentCampaignIndex];
        if (campaign && campaign.items.length === 1 && this.campaigns.length === 1) {
            const video = player === 'A' ? this.videoA : this.videoB;
            video.currentTime = 0;
            video.play().catch(() => {});
            return;
        }

        this.advanceToNext();
    },

    // Handle video error
    handleVideoError: function(player, error) {
        console.error('Video error on player ' + player + ':', error);
        if (this.isPlaying) {
            this.advanceToNext();
        }
    },

    // Preload next item
    preloadNext: function() {
        const next = this.getNextIndices();
        const campaign = this.campaigns[next.campaignIndex];
        if (!campaign) return;

        const item = campaign.items[next.itemIndex];
        if (!item || item.type !== 'video') return;

        // Preload in inactive player
        const preloadVideo = this.activePlayer === 'A' ? this.videoB : this.videoA;
        preloadVideo.src = item.src;
        preloadVideo.load();
    },

    // Get next indices
    getNextIndices: function() {
        let nextItem = this.currentItemIndex + 1;
        let nextCampaign = this.currentCampaignIndex;

        const campaign = this.campaigns[this.currentCampaignIndex];
        
        if (nextItem >= campaign.items.length) {
            nextItem = 0;
            nextCampaign++;
            
            if (nextCampaign >= this.campaigns.length) {
                nextCampaign = 0;
            }
        }

        return { itemIndex: nextItem, campaignIndex: nextCampaign };
    },

    // Advance to next item
    advanceToNext: function() {
        if (!this.isPlaying) return;

        const next = this.getNextIndices();
        this.currentItemIndex = next.itemIndex;
        this.currentCampaignIndex = next.campaignIndex;

        // Switch active player for videos
        this.activePlayer = this.activePlayer === 'A' ? 'B' : 'A';

        this.playCurrentItem();
    },

    // Hide all media
    hideAllMedia: function() {
        this.image.classList.remove('active');
        this.videoA.classList.remove('active');
        this.videoB.classList.remove('active');
    },

    // Clear image timer
    clearImageTimer: function() {
        if (this.imageTimer) {
            clearTimeout(this.imageTimer);
            this.imageTimer = null;
        }
    },

    // Handle screen tap (double-tap to exit)
    handleTap: function() {
        this.tapCount++;
        
        // Show overlay briefly
        this.overlay.classList.add('visible');
        setTimeout(() => this.overlay.classList.remove('visible'), 1500);

        if (this.tapCount >= 2) {
            this.stop();
            this.tapCount = 0;
            clearTimeout(this.tapTimeout);
            return;
        }

        clearTimeout(this.tapTimeout);
        this.tapTimeout = setTimeout(() => {
            this.tapCount = 0;
        }, 500);
    },

    // Apply screen orientation
    applyOrientation: function(orientation) {
        const container = this.container;
        container.className = 'player-container';
        
        switch (orientation) {
            case 'landscape-inverted':
                container.classList.add('orientation-landscape-inverted');
                break;
            case 'portrait':
                container.classList.add('orientation-portrait');
                break;
            case 'portrait-inverted':
                container.classList.add('orientation-portrait-inverted');
                break;
            default:
                container.classList.add('orientation-landscape');
        }
    }
};
