// CYBIM Signage Player - Offline Android TV App
(function() {
    'use strict';

    // ==================== STORAGE ====================
    const Storage = {
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem('cybim_' + key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                return defaultValue;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem('cybim_' + key, JSON.stringify(value));
                return true;
            } catch (e) {
                return false;
            }
        },
        getCampaigns() {
            return this.get('campaigns', []);
        },
        saveCampaigns(campaigns) {
            return this.set('campaigns', campaigns);
        },
        getSettings() {
            return this.get('settings', {
                orientation: 'landscape',
                defaultDuration: 5
            });
        },
        saveSettings(settings) {
            return this.set('settings', settings);
        }
    };

    // ==================== APP STATE ====================
    let currentScreen = 'splash-screen';
    let currentCampaign = null;
    let campaigns = [];
    let settings = {};

    // ==================== DOM ELEMENTS ====================
    const $ = (id) => document.getElementById(id);
    const screens = {
        splash: $('splash-screen'),
        home: $('home-screen'),
        campaigns: $('campaigns-screen'),
        editor: $('editor-screen'),
        settings: $('settings-screen'),
        about: $('about-screen'),
        play: $('play-screen')
    };

    // ==================== SCREEN NAVIGATION ====================
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const screen = $(screenId);
        if (screen) {
            screen.classList.add('active');
            currentScreen = screenId;
            // Focus first focusable element
            const focusable = screen.querySelector('button, input, select');
            if (focusable) focusable.focus();
        }
    }

    function goBack() {
        const backMap = {
            'campaigns-screen': 'home-screen',
            'editor-screen': 'campaigns-screen',
            'settings-screen': 'home-screen',
            'about-screen': 'home-screen',
            'play-screen': 'home-screen'
        };
        const target = backMap[currentScreen];
        if (target) showScreen(target);
    }

    // ==================== CLOCK ====================
    function updateClock() {
        const clock = $('clock');
        if (clock) {
            const now = new Date();
            clock.textContent = now.toLocaleDateString() + ' ' + 
                now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }

    // ==================== ORIENTATION ====================
    function applyOrientation(orientation) {
        document.body.classList.remove(
            'orientation-landscape',
            'orientation-portrait',
            'orientation-landscape-inverted',
            'orientation-portrait-inverted'
        );
        if (orientation && orientation !== 'landscape') {
            document.body.classList.add('orientation-' + orientation);
        }
    }

    // ==================== CAMPAIGNS ====================
    function renderCampaignList() {
        const list = $('campaign-list');
        campaigns = Storage.getCampaigns();

        if (campaigns.length === 0) {
            list.innerHTML = '<div class="empty-state"><p>No campaigns yet</p><p>Tap "Add" to create one</p></div>';
            return;
        }

        list.innerHTML = campaigns.map((c, i) => `
            <div class="campaign-item">
                <div class="campaign-info">
                    <div class="campaign-name">${escapeHtml(c.name)}</div>
                    <div class="campaign-meta">${c.media.length} items</div>
                </div>
                <div class="campaign-actions">
                    <button class="btn-icon btn-play" data-action="play" data-index="${i}">▶</button>
                    <button class="btn-icon btn-edit" data-action="edit" data-index="${i}">✎</button>
                    <button class="btn-icon btn-delete" data-action="delete" data-index="${i}">✕</button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        list.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(btn.dataset.index);
                const action = btn.dataset.action;
                if (action === 'play') playCampaign(index);
                else if (action === 'edit') openEditor(index);
                else if (action === 'delete') deleteCampaign(index);
            });
        });
    }

    function openEditor(index = -1) {
        if (index >= 0 && campaigns[index]) {
            currentCampaign = { ...campaigns[index], _index: index };
            $('editor-title').textContent = 'Edit Campaign';
        } else {
            currentCampaign = {
                id: Date.now().toString(),
                name: '',
                media: [],
                duration: settings.defaultDuration || 5,
                _index: -1
            };
            $('editor-title').textContent = 'New Campaign';
        }

        $('campaign-name').value = currentCampaign.name;
        $('image-duration').value = currentCampaign.duration;
        renderMediaList();
        showScreen('editor-screen');
    }

    function renderMediaList() {
        const list = $('media-list');
        if (!currentCampaign || currentCampaign.media.length === 0) {
            list.innerHTML = '<div class="empty-state">No media added</div>';
            return;
        }

        list.innerHTML = currentCampaign.media.map((m, i) => `
            <div class="media-item">
                ${m.type === 'image' 
                    ? `<img src="${m.url}" class="media-thumb" alt="">` 
                    : `<video src="${m.url}" class="media-thumb"></video>`}
                <span class="media-name">${escapeHtml(m.name)}</span>
                <button class="media-remove" data-index="${i}">✕</button>
            </div>
        `).join('');

        list.querySelectorAll('.media-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                currentCampaign.media.splice(idx, 1);
                renderMediaList();
            });
        });
    }

    function handleMediaFiles(files) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const type = file.type.startsWith('video') ? 'video' : 'image';
                currentCampaign.media.push({
                    id: Date.now().toString() + Math.random(),
                    name: file.name,
                    type: type,
                    url: e.target.result
                });
                renderMediaList();
            };
            reader.readAsDataURL(file);
        });
    }

    function saveCampaign() {
        if (!currentCampaign) return;

        currentCampaign.name = $('campaign-name').value.trim() || 'Untitled';
        currentCampaign.duration = parseInt($('image-duration').value) || 5;

        const idx = currentCampaign._index;
        delete currentCampaign._index;

        if (idx >= 0) {
            campaigns[idx] = currentCampaign;
        } else {
            campaigns.push(currentCampaign);
        }

        Storage.saveCampaigns(campaigns);
        showScreen('campaigns-screen');
        renderCampaignList();
    }

    function deleteCampaign(index) {
        if (confirm('Delete this campaign?')) {
            campaigns.splice(index, 1);
            Storage.saveCampaigns(campaigns);
            renderCampaignList();
        }
    }

    // ==================== PLAYER ====================
    let playerState = {
        isPlaying: false,
        campaign: null,
        currentIndex: 0,
        timer: null,
        tapCount: 0,
        tapTimer: null
    };

    const playerImage = $('player-image');
    const playerVideo = $('player-video');
    const playerOverlay = $('player-overlay');

    function playCampaign(index) {
        const campaign = campaigns[index];
        if (!campaign || campaign.media.length === 0) {
            alert('No media in this campaign');
            return;
        }

        playerState.campaign = campaign;
        playerState.currentIndex = 0;
        playerState.isPlaying = true;

        showScreen('play-screen');
        playCurrentItem();
    }

    function playAllCampaigns() {
        campaigns = Storage.getCampaigns();
        const allMedia = campaigns.flatMap(c => c.media);
        
        if (allMedia.length === 0) {
            alert('No media to play');
            return;
        }

        // Create a merged campaign
        playerState.campaign = {
            name: 'All Campaigns',
            media: allMedia,
            duration: settings.defaultDuration || 5
        };
        playerState.currentIndex = 0;
        playerState.isPlaying = true;

        showScreen('play-screen');
        playCurrentItem();
    }

    function playCurrentItem() {
        if (!playerState.isPlaying || !playerState.campaign) return;

        const media = playerState.campaign.media;
        if (media.length === 0) return;

        const item = media[playerState.currentIndex];
        
        // Clear previous
        clearTimeout(playerState.timer);
        playerImage.classList.remove('active');
        playerVideo.classList.remove('active');
        playerVideo.pause();

        if (item.type === 'video') {
            playerVideo.src = item.url;
            playerVideo.classList.add('active');
            playerVideo.currentTime = 0;
            
            const playVideo = () => {
                playerVideo.play().then(() => {
                    playerVideo.muted = false;
                }).catch(() => {
                    playerVideo.muted = true;
                    playerVideo.play().catch(() => {});
                });
            };

            if (playerVideo.readyState >= 3) {
                playVideo();
            } else {
                playerVideo.addEventListener('canplay', playVideo, { once: true });
                playerVideo.load();
            }
        } else {
            playerImage.src = item.url;
            playerImage.classList.add('active');
            
            const duration = (playerState.campaign.duration || 5) * 1000;
            playerState.timer = setTimeout(advancePlayer, duration);
        }
    }

    function advancePlayer() {
        if (!playerState.isPlaying) return;
        
        playerState.currentIndex++;
        if (playerState.currentIndex >= playerState.campaign.media.length) {
            playerState.currentIndex = 0;
        }
        playCurrentItem();
    }

    function stopPlayer() {
        playerState.isPlaying = false;
        clearTimeout(playerState.timer);
        playerVideo.pause();
        playerVideo.src = '';
        playerImage.src = '';
        playerImage.classList.remove('active');
        playerVideo.classList.remove('active');
        showScreen('home-screen');
    }

    // Video ended handler
    playerVideo.addEventListener('ended', () => {
        if (playerState.isPlaying) advancePlayer();
    });

    // Double-tap to exit
    playerOverlay.addEventListener('click', () => {
        playerState.tapCount++;
        
        if (playerState.tapCount === 1) {
            playerState.tapTimer = setTimeout(() => {
                playerState.tapCount = 0;
            }, 500);
        } else if (playerState.tapCount >= 2) {
            clearTimeout(playerState.tapTimer);
            playerState.tapCount = 0;
            stopPlayer();
        }
    });

    // ==================== SETTINGS ====================
    function loadSettings() {
        settings = Storage.getSettings();
        $('setting-orientation').value = settings.orientation || 'landscape';
        $('setting-duration').value = settings.defaultDuration || 5;
        applyOrientation(settings.orientation);
    }

    function saveSettings() {
        settings.orientation = $('setting-orientation').value;
        settings.defaultDuration = parseInt($('setting-duration').value) || 5;
        Storage.saveSettings(settings);
        applyOrientation(settings.orientation);
        showScreen('home-screen');
    }

    // ==================== UTILITIES ====================
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== EVENT LISTENERS ====================
    function setupEventListeners() {
        // Home buttons
        $('btn-play').addEventListener('click', playAllCampaigns);
        $('btn-campaigns').addEventListener('click', () => {
            renderCampaignList();
            showScreen('campaigns-screen');
        });
        $('btn-settings').addEventListener('click', () => {
            loadSettings();
            showScreen('settings-screen');
        });
        $('btn-about').addEventListener('click', () => showScreen('about-screen'));

        // Back buttons
        $('campaigns-back').addEventListener('click', goBack);
        $('editor-back').addEventListener('click', goBack);
        $('settings-back').addEventListener('click', goBack);
        $('about-back').addEventListener('click', goBack);

        // Campaigns
        $('btn-add-campaign').addEventListener('click', () => openEditor(-1));

        // Editor
        $('btn-add-media').addEventListener('click', () => $('media-input').click());
        $('media-input').addEventListener('change', (e) => handleMediaFiles(e.target.files));
        $('btn-save-campaign').addEventListener('click', saveCampaign);

        // Settings
        $('btn-save-settings').addEventListener('click', saveSettings);

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' || e.key === 'Escape') {
                e.preventDefault();
                if (currentScreen === 'play-screen') {
                    stopPlayer();
                } else {
                    goBack();
                }
            }
        });
    }

    // ==================== INITIALIZATION ====================
    function init() {
        // Load data
        campaigns = Storage.getCampaigns();
        settings = Storage.getSettings();
        applyOrientation(settings.orientation);

        // Setup
        setupEventListeners();
        updateClock();
        setInterval(updateClock, 1000);

        // Show splash then home
        setTimeout(() => {
            showScreen('home-screen');
        }, 2500);
    }

    // Start app
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
