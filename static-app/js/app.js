/**
 * CYBIM Main Application Module
 * Handles navigation, UI, and app lifecycle
 * 100% Offline - No network requests
 */

const App = {
    currentScreen: 'splash-screen',
    currentCampaign: null,
    focusIndex: 0,

    // Initialize app
    init: function() {
        // Initialize player
        Player.init();

        // Setup navigation
        this.setupNavigation();
        
        // Setup home screen
        this.setupHomeScreen();
        
        // Setup campaigns screen
        this.setupCampaignsScreen();
        
        // Setup editor screen
        this.setupEditorScreen();
        
        // Setup settings screen
        this.setupSettingsScreen();

        // Start clock
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);

        // Apply saved orientation
        const settings = Storage.getSettings();
        this.applyAppOrientation(settings.orientation);

        // Show splash then home
        setTimeout(() => {
            this.showScreen('home-screen');
            
            // Auto-start if enabled
            if (settings.autoStart) {
                const campaigns = Storage.getCampaigns();
                if (campaigns.length > 0) {
                    Player.start(campaigns);
                }
            }
        }, 2500);
    },

    // Show screen
    showScreen: function(screenId) {
        // Hide current
        const current = document.getElementById(this.currentScreen);
        if (current) {
            current.classList.remove('active');
        }

        // Show new
        const next = document.getElementById(screenId);
        if (next) {
            next.classList.add('active');
            this.currentScreen = screenId;

            // Focus first focusable element
            const focusable = next.querySelector('button, input, select, [tabindex]');
            if (focusable) {
                focusable.focus();
            }
        }
    },

    // Setup navigation handlers
    setupNavigation: function() {
        // Back buttons
        document.getElementById('campaigns-back').addEventListener('click', () => this.showScreen('home-screen'));
        document.getElementById('editor-back').addEventListener('click', () => this.showScreen('campaigns-screen'));
        document.getElementById('settings-back').addEventListener('click', () => {
            // Restore saved orientation on back
            const settings = Storage.getSettings();
            this.applyAppOrientation(settings.orientation);
            this.showScreen('home-screen');
        });
        document.getElementById('about-back').addEventListener('click', () => this.showScreen('home-screen'));

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' || e.key === 'Back') {
                e.preventDefault();
                this.handleBack();
            }
        });
    },

    // Handle back button
    handleBack: function() {
        switch (this.currentScreen) {
            case 'campaigns-screen':
            case 'settings-screen':
            case 'about-screen':
                this.showScreen('home-screen');
                break;
            case 'editor-screen':
                this.showScreen('campaigns-screen');
                break;
        }
    },

    // Setup home screen
    setupHomeScreen: function() {
        document.getElementById('btn-play').addEventListener('click', () => {
            const campaigns = Storage.getCampaigns();
            if (campaigns.length === 0) {
                alert('No campaigns available. Create a campaign first.');
                return;
            }
            Player.start(campaigns);
        });

        document.getElementById('btn-campaigns').addEventListener('click', () => {
            this.refreshCampaignList();
            this.showScreen('campaigns-screen');
        });

        document.getElementById('btn-settings').addEventListener('click', () => {
            this.loadSettings();
            this.showScreen('settings-screen');
        });

        document.getElementById('btn-about').addEventListener('click', () => {
            this.showScreen('about-screen');
        });
    },

    // Setup campaigns screen
    setupCampaignsScreen: function() {
        document.getElementById('btn-add-campaign').addEventListener('click', () => {
            this.openEditor(null);
        });
    },

    // Refresh campaign list
    refreshCampaignList: function() {
        const campaigns = Storage.getCampaigns();
        const listEl = document.getElementById('campaign-list');
        const emptyEl = document.getElementById('empty-campaigns');

        if (campaigns.length === 0) {
            listEl.innerHTML = '';
            emptyEl.style.display = 'block';
            return;
        }

        emptyEl.style.display = 'none';
        listEl.innerHTML = campaigns.map(c => `
            <div class="campaign-item" tabindex="0" data-id="${c.id}">
                <div class="campaign-info" onclick="App.openEditor('${c.id}')">
                    <div class="campaign-name">${this.escapeHtml(c.name)}</div>
                    <div class="campaign-meta">${c.items.length} item${c.items.length !== 1 ? 's' : ''}</div>
                </div>
                <div class="campaign-actions">
                    <button class="btn-icon" onclick="App.playCampaign('${c.id}')" title="Play">▶</button>
                    <button class="btn-icon danger" onclick="App.deleteCampaign('${c.id}')" title="Delete">✕</button>
                </div>
            </div>
        `).join('');
    },

    // Play single campaign
    playCampaign: function(id) {
        const campaign = Storage.getCampaign(id);
        if (campaign) {
            Player.start([campaign]);
        }
    },

    // Delete campaign
    deleteCampaign: function(id) {
        if (confirm('Delete this campaign?')) {
            Storage.deleteCampaign(id);
            this.refreshCampaignList();
        }
    },

    // Setup editor screen
    setupEditorScreen: function() {
        // Save button
        document.getElementById('btn-save-campaign').addEventListener('click', () => {
            this.saveCampaign();
        });

        // Add media button
        document.getElementById('btn-add-media').addEventListener('click', () => {
            document.getElementById('media-input').click();
        });

        // Media input handler
        document.getElementById('media-input').addEventListener('change', (e) => {
            this.handleMediaFiles(e.target.files);
        });

        // Schedule checkbox
        document.getElementById('schedule-enabled').addEventListener('change', (e) => {
            document.getElementById('schedule-times').style.display = e.target.checked ? 'block' : 'none';
        });
    },

    // Open editor
    openEditor: function(campaignId) {
        if (campaignId) {
            this.currentCampaign = Storage.getCampaign(campaignId);
            document.getElementById('editor-title').textContent = 'Edit Campaign';
        } else {
            this.currentCampaign = Storage.createCampaign('');
            document.getElementById('editor-title').textContent = 'New Campaign';
        }

        // Populate form
        document.getElementById('campaign-name').value = this.currentCampaign.name;
        document.getElementById('image-duration').value = this.currentCampaign.imageDuration || 5;
        document.getElementById('schedule-enabled').checked = this.currentCampaign.schedule?.enabled || false;
        document.getElementById('schedule-start').value = this.currentCampaign.schedule?.startTime || '08:00';
        document.getElementById('schedule-end').value = this.currentCampaign.schedule?.endTime || '22:00';
        document.getElementById('schedule-times').style.display = 
            this.currentCampaign.schedule?.enabled ? 'block' : 'none';

        this.refreshMediaList();
        this.showScreen('editor-screen');
    },

    // Handle media file selection
    handleMediaFiles: function(files) {
        if (!files || files.length === 0) return;

        for (let file of files) {
            const type = file.type.startsWith('video/') ? 'video' : 'image';
            
            // Read file as data URL for local storage
            const reader = new FileReader();
            reader.onload = (e) => {
                this.currentCampaign.items.push({
                    id: 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    type: type,
                    name: file.name,
                    src: e.target.result,
                    duration: 5
                });
                this.refreshMediaList();
            };
            reader.readAsDataURL(file);
        }

        // Clear input
        document.getElementById('media-input').value = '';
    },

    // Refresh media list in editor
    refreshMediaList: function() {
        const listEl = document.getElementById('media-list');
        
        if (!this.currentCampaign.items || this.currentCampaign.items.length === 0) {
            listEl.innerHTML = '<p style="color: var(--text-muted); padding: 16px;">No media added yet</p>';
            return;
        }

        listEl.innerHTML = this.currentCampaign.items.map((item, index) => `
            <div class="media-item">
                ${item.type === 'image' 
                    ? `<img src="${item.src}" class="media-thumb" alt="">`
                    : `<video src="${item.src}" class="media-thumb"></video>`
                }
                <div class="media-info">
                    <div class="media-name">${this.escapeHtml(item.name)}</div>
                    <div class="media-type">${item.type}</div>
                </div>
                <button class="btn-icon danger" onclick="App.removeMedia(${index})">✕</button>
            </div>
        `).join('');
    },

    // Remove media item
    removeMedia: function(index) {
        this.currentCampaign.items.splice(index, 1);
        this.refreshMediaList();
    },

    // Save campaign
    saveCampaign: function() {
        const name = document.getElementById('campaign-name').value.trim();
        
        if (!name) {
            alert('Please enter a campaign name');
            return;
        }

        this.currentCampaign.name = name;
        this.currentCampaign.imageDuration = parseInt(document.getElementById('image-duration').value) || 5;
        this.currentCampaign.schedule = {
            enabled: document.getElementById('schedule-enabled').checked,
            startTime: document.getElementById('schedule-start').value,
            endTime: document.getElementById('schedule-end').value,
            days: [0, 1, 2, 3, 4, 5, 6]
        };
        this.currentCampaign.updatedAt = new Date().toISOString();

        Storage.saveCampaign(this.currentCampaign);
        this.refreshCampaignList();
        this.showScreen('campaigns-screen');
    },

    // Setup settings screen
    setupSettingsScreen: function() {
        // Orientation change preview
        document.getElementById('orientation-select').addEventListener('change', (e) => {
            this.applyAppOrientation(e.target.value);
        });

        // Save settings
        document.getElementById('btn-save-settings').addEventListener('click', () => {
            const settings = {
                orientation: document.getElementById('orientation-select').value,
                defaultDuration: parseInt(document.getElementById('default-duration').value) || 5,
                autoStart: document.getElementById('auto-start').checked
            };
            Storage.saveSettings(settings);
            this.showScreen('home-screen');
        });
    },

    // Load settings into form
    loadSettings: function() {
        const settings = Storage.getSettings();
        document.getElementById('orientation-select').value = settings.orientation;
        document.getElementById('default-duration').value = settings.defaultDuration;
        document.getElementById('auto-start').checked = settings.autoStart;
    },

    // Apply app-level orientation
    applyAppOrientation: function(orientation) {
        const body = document.body;
        
        // Remove existing orientation classes
        body.classList.remove(
            'orientation-landscape',
            'orientation-landscape-inverted',
            'orientation-portrait',
            'orientation-portrait-inverted'
        );

        // Apply new orientation
        body.classList.add('orientation-' + orientation);

        // Apply transform based on orientation
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        switch (orientation) {
            case 'landscape':
                body.style.transform = 'none';
                body.style.width = '100vw';
                body.style.height = '100vh';
                break;
            case 'landscape-inverted':
                body.style.transform = 'rotate(180deg)';
                body.style.width = '100vw';
                body.style.height = '100vh';
                break;
            case 'portrait':
                body.style.transform = `rotate(-90deg) translateX(-${vh}px)`;
                body.style.transformOrigin = 'top left';
                body.style.width = vh + 'px';
                body.style.height = vw + 'px';
                break;
            case 'portrait-inverted':
                body.style.transform = `rotate(90deg) translateY(-${vw}px)`;
                body.style.transformOrigin = 'top left';
                body.style.width = vh + 'px';
                body.style.height = vw + 'px';
                break;
        }
    },

    // Update clock display
    updateClock: function() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        const dateStr = now.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        const el = document.getElementById('nav-time');
        if (el) {
            el.textContent = `${dateStr} ${timeStr}`;
        }
    },

    // Escape HTML for display
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
