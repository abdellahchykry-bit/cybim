/**
 * CYBIM Storage Module
 * Handles localStorage for campaigns and settings
 * 100% Offline - No network requests
 */

const Storage = {
    KEYS: {
        CAMPAIGNS: 'cybim_campaigns',
        SETTINGS: 'cybim_settings'
    },

    // Default settings
    defaultSettings: {
        orientation: 'landscape',
        defaultDuration: 5,
        autoStart: true
    },

    // Get all campaigns
    getCampaigns: function() {
        try {
            const data = localStorage.getItem(this.KEYS.CAMPAIGNS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading campaigns:', e);
            return [];
        }
    },

    // Save all campaigns
    saveCampaigns: function(campaigns) {
        try {
            localStorage.setItem(this.KEYS.CAMPAIGNS, JSON.stringify(campaigns));
            return true;
        } catch (e) {
            console.error('Error saving campaigns:', e);
            return false;
        }
    },

    // Get single campaign by ID
    getCampaign: function(id) {
        const campaigns = this.getCampaigns();
        return campaigns.find(c => c.id === id) || null;
    },

    // Save or update a campaign
    saveCampaign: function(campaign) {
        const campaigns = this.getCampaigns();
        const index = campaigns.findIndex(c => c.id === campaign.id);
        
        if (index >= 0) {
            campaigns[index] = campaign;
        } else {
            campaigns.push(campaign);
        }
        
        return this.saveCampaigns(campaigns);
    },

    // Delete a campaign
    deleteCampaign: function(id) {
        const campaigns = this.getCampaigns();
        const filtered = campaigns.filter(c => c.id !== id);
        return this.saveCampaigns(filtered);
    },

    // Get settings
    getSettings: function() {
        try {
            const data = localStorage.getItem(this.KEYS.SETTINGS);
            return data ? { ...this.defaultSettings, ...JSON.parse(data) } : { ...this.defaultSettings };
        } catch (e) {
            console.error('Error reading settings:', e);
            return { ...this.defaultSettings };
        }
    },

    // Save settings
    saveSettings: function(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Error saving settings:', e);
            return false;
        }
    },

    // Generate unique ID
    generateId: function() {
        return 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Create new campaign object
    createCampaign: function(name) {
        return {
            id: this.generateId(),
            name: name || 'Untitled Campaign',
            items: [],
            imageDuration: 5,
            schedule: {
                enabled: false,
                startTime: '08:00',
                endTime: '22:00',
                days: [0, 1, 2, 3, 4, 5, 6]
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }
};
