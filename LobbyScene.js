import Phaser from 'phaser';

export default class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' });
    }

    preload() {
        this.load.image('background', '/assets/background.png');
        this.load.image('logo', '/assets/logo.png');
        // Creatures PNG
        this.load.image('seed', '/assets/seed.png');
        this.load.image('tree', '/assets/tree.png');
        this.load.image('ancient_tree', '/assets/ancient_tree.png');
        this.load.image('flytrap', '/assets/flytrap.png');
        this.load.image('carnivore', '/assets/carnivore.png');

        // === AUDIO ===
        this.load.audio('bgMusic', '/assets/sounds/EvoWorld_Background_Music.mp3');
        this.load.audio('clickSound', '/assets/sounds/click.wav');
        this.load.audio('collectSound', '/assets/sounds/collect.m4a');
        this.load.audio('hitSound', '/assets/sounds/hit.wav');
        this.load.audio('levelupSound', '/assets/sounds/levelup.mp3');
        this.load.audio('rainSound', '/assets/sounds/rain.wav');
    }

    create() {
        // 1. Full Screen Background
        const bg = this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'background');
        bg.setDisplaySize(window.innerWidth, window.innerHeight);

        // === AUDIO SYSTEM ===
        this.initAudio();

        // === EPIC EFFECTS ===

        // 1. Floating Green Particles (nature dust)
        this.add.particles(0, 0, 'background', {
            x: { min: 0, max: window.innerWidth },
            y: { min: 0, max: window.innerHeight },
            scale: { start: 0.02, end: 0 },
            alpha: { start: 0.7, end: 0 },
            lifespan: 6000,
            speedY: { min: -20, max: -50 },
            speedX: { min: -10, max: 10 },
            quantity: 2,
            frequency: 100,
            tint: [0x7cff9c, 0x50ffa0, 0xaaffcc, 0x00ff66],
            blendMode: 'ADD'
        });

        // 2. Many Glowing Orbs (floating lights)
        for (let i = 0; i < 20; i++) {
            const colors = [0x00ff88, 0x88ff00, 0x00ffcc, 0xaaff55, 0x55ffaa];
            const orb = this.add.circle(
                Math.random() * window.innerWidth,
                Math.random() * window.innerHeight,
                Math.random() * 50 + 20,
                colors[Math.floor(Math.random() * colors.length)],
                0.08 + Math.random() * 0.12
            );
            orb.setBlendMode(Phaser.BlendModes.ADD);

            // Float animation
            this.tweens.add({
                targets: orb,
                x: orb.x + (Math.random() - 0.5) * 400,
                y: orb.y + (Math.random() - 0.5) * 300,
                alpha: { from: 0.08, to: 0.2 },
                scale: { from: 1, to: 0.4 + Math.random() * 0.6 },
                duration: 5000 + Math.random() * 8000,
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }



        // 4. Sparkle particles (magical dust)
        this.add.particles(0, 0, 'background', {
            x: { min: 0, max: window.innerWidth },
            y: { min: 0, max: window.innerHeight },
            scale: { start: 0.008, end: 0.015, ease: 'Sine.easeOut' },
            alpha: { start: 0, end: 0.8, ease: 'Sine.easeIn' },
            lifespan: 2000,
            speedY: { min: -5, max: 5 },
            speedX: { min: -5, max: 5 },
            quantity: 1,
            frequency: 200,
            tint: [0xffffff, 0xffffaa, 0xaaffff],
            blendMode: 'ADD'
        });



        // Logo Image at Top - BIGGER with effects
        this.logo = this.add.image(window.innerWidth / 2, 140, 'logo');
        this.logo.setScale(1.2);
        this.logo.setDepth(100);

        // Glow effect behind logo
        this.logoGlow = this.add.image(window.innerWidth / 2, 140, 'logo');
        this.logoGlow.setScale(1.3);
        this.logoGlow.setDepth(99);
        this.logoGlow.setTint(0x00ff00);
        this.logoGlow.setAlpha(0.3);
        this.logoGlow.setBlendMode(Phaser.BlendModes.ADD);

        // Glow pulsing
        this.tweens.add({
            targets: this.logoGlow,
            alpha: 0.5,
            scaleX: 1.35,
            scaleY: 1.35,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Logo breathing animation
        this.tweens.add({
            targets: this.logo,
            scaleX: 1.25,
            scaleY: 1.25,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Skin Preview (Rotating Entity that changes)
        this.creatures = ['seed', 'tree', 'carnivore', 'flytrap', 'ancient_tree'];
        this.currentCreatureIndex = 0;

        this.skinPreview = this.add.image(window.innerWidth / 2, window.innerHeight / 2 + 25, 'seed').setScale(0.6);
        this.skinPreview.setAlpha(0.85);

        // Slow floating rotation
        this.tweens.add({
            targets: this.skinPreview,
            angle: 360,
            duration: 15000,
            repeat: -1,
            ease: 'Linear'
        });

        // Gentle floating up and down
        this.tweens.add({
            targets: this.skinPreview,
            y: this.skinPreview.y - 15,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Change creature every 3 seconds with fade effect
        this.time.addEvent({
            delay: 3000,
            callback: () => {
                // Fade out
                this.tweens.add({
                    targets: this.skinPreview,
                    alpha: 0,
                    scale: 0.15,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => {
                        // Change texture
                        this.currentCreatureIndex = (this.currentCreatureIndex + 1) % this.creatures.length;
                        this.skinPreview.setTexture(this.creatures[this.currentCreatureIndex]);

                        // Fade in - SAME SIZE for all
                        this.tweens.add({
                            targets: this.skinPreview,
                            alpha: 0.85,
                            scale: 1,
                            duration: 400,
                            ease: 'Back.easeOut'
                        });
                    }
                });
            },
            loop: true
        });

        // Check Login State (Mock)
        const isLoggedIn = localStorage.getItem('evoworld_token') === 'true';
        const username = localStorage.getItem('evoworld_username') || 'Guest';

        // Load Real Stats
        const level = parseInt(localStorage.getItem('evoworld_level')) || 1;
        const xp = parseInt(localStorage.getItem('evoworld_xp')) || 0;
        const maxXp = level * 1000;
        const xpPercent = (xp / maxXp) * 100;

        // Daily Reward Logic
        const lastClaim = localStorage.getItem('evoworld_daily_claim');
        const now = Date.now();
        const canClaim = !lastClaim || (now - parseInt(lastClaim) > 86400000); // 24h

        // 2. HTML UI
        const html = `
            <div class="menu-overlay">

                <!-- Updates - Floating Text -->
                <div class="updates-floating">
                    <div class="update-item">⚔️ Bot Aggression: Watch out!</div>
                    <div class="update-item">🎁 Daily Rewards: Free XP!</div>
                    <div class="update-item">🧬 Mutation System Added!</div>
                </div>

                <!-- RIGHT SIDE PANEL -->
                <div class="right-panel">
                    <!-- Mini Leaderboard -->
                    <div class="mini-leaderboard">
                        <div class="leaderboard-title">🏆 Top Players</div>
                        <div class="leaderboard-list">
                            <div class="leaderboard-item gold"><span class="rank">1</span><span class="name">xXProPlayer</span><span class="score">15,420</span></div>
                            <div class="leaderboard-item silver"><span class="rank">2</span><span class="name">NatureKing</span><span class="score">12,850</span></div>
                            <div class="leaderboard-item bronze"><span class="rank">3</span><span class="name">EvoMaster</span><span class="score">11,200</span></div>
                            <div class="leaderboard-item"><span class="rank">4</span><span class="name">TreeHugger</span><span class="score">9,540</span></div>
                            <div class="leaderboard-item"><span class="rank">5</span><span class="name">Survivor99</span><span class="score">8,100</span></div>
                        </div>
                    </div>

                    <!-- Quick Settings -->
                    <div class="quick-settings">
                        <div class="settings-title">⚙️ Quick Settings</div>
                        <div class="setting-item">
                            <span>🔊 Sound</span>
                            <label class="toggle"><input type="checkbox" checked><span class="slider"></span></label>
                        </div>
                        <div class="setting-item">
                            <span>🎵 Music</span>
                            <label class="toggle"><input type="checkbox" checked><span class="slider"></span></label>
                        </div>
                        <div class="setting-item">
                            <span>✨ Effects</span>
                            <label class="toggle"><input type="checkbox" checked><span class="slider"></span></label>
                        </div>
                    </div>
                </div>

                <!-- Auth Corner (Top Right) - Only when Logged OUT -->
                ${!isLoggedIn ? `
                    <div class="auth-corner">
                        <button class="auth-btn btn-login" id="openLoginBtn">Log In</button>
                        <button class="auth-btn btn-register" id="openRegisterBtn">Register</button>
                    </div>
                ` : ''}

                <!-- Play Card - Bottom Center -->
                <div class="play-card">
                    <input type="text" id="nickname" class="play-input" placeholder="Enter nickname..." maxlength="15" value="${isLoggedIn ? username : ''}">
                    <select id="server" class="play-select">
                        <option value="eu1">🇪🇺 EU</option>
                        <option value="us1">🇺🇸 US</option>
                        <option value="asia">🌏 Asia</option>
                    </select>
                    <button id="playBtn" class="play-btn-new">▶ PLAY</button>
                </div>

                <!-- Socials - Bottom Right -->
                <div class="socials-bottom">
                    <a href="https://discord.gg/GGSP3WWwaJ" class="social-icon discord" target="_blank"><i class="fa-brands fa-discord"></i></a>
                    <a href="https://twitter.com/evoworld" class="social-icon twitter" target="_blank"><i class="fa-brands fa-x-twitter"></i></a>
                    <a href="https://youtube.com/@evoworld" class="social-icon youtube" target="_blank"><i class="fa-brands fa-youtube"></i></a>
                    <a href="https://facebook.com/evoworld" class="social-icon facebook" target="_blank"><i class="fa-brands fa-facebook-f"></i></a>
                </div>
                
                <!-- Login Modal -->
                <div id="loginModal" class="auth-modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Welcome Back</h3>
                        <button class="close-btn" id="closeLogin">×</button>
                    </div>
                    <div class="input-group">
                        <label class="input-label">USERNAME</label>
                        <input type="text" id="loginUser" class="menu-input" placeholder="Username">
                    </div>
                    <div class="input-group">
                        <label class="input-label">PASSWORD</label>
                        <input type="password" id="loginPass" class="menu-input" placeholder="Password">
                    </div>
                    <button class="modal-submit-btn" id="submitLogin">LOG IN</button>
                </div>

                <!-- Register Modal -->
                <div id="registerModal" class="auth-modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Create Account</h3>
                        <button class="close-btn" id="closeRegister">×</button>
                    </div>
                    <div class="input-group">
                        <label class="input-label">EMAIL</label>
                        <input type="email" id="regEmail" class="menu-input" placeholder="Email Address">
                    </div>
                    <div class="input-group">
                        <label class="input-label">USERNAME</label>
                        <input type="text" id="regUser" class="menu-input" placeholder="Choose Username">
                    </div>
                    <div class="input-group">
                        <label class="input-label">PASSWORD</label>
                        <input type="password" id="regPass" class="menu-input" placeholder="Create Password">
                    </div>
                    <button class="modal-submit-btn" id="submitRegister" style="background: #00ff00; color: black;">REGISTER</button>
                </div>

                <div style="position: absolute; bottom: 10px; color: #666; font-size: 12px;">
                    © 2025 EvoWorld.io | v0.4.0
                </div>
            </div>
            
            <!-- Profile Panel (Left Center) - OUTSIDE menu-overlay - Only when Logged IN -->
            ${isLoggedIn ? `
                <div class="profile-panel-mini">
                    <div class="mini-avatar">👤</div>
                    <div class="mini-info">
                        <span class="mini-name">${username}</span>
                        <span class="mini-level">Level ${level}</span>
                    </div>
                    <div class="mini-xp-bar">
                        <div class="mini-xp-fill" style="width: ${xpPercent}%"></div>
                    </div>
                    <div class="mini-buttons">
                        <button class="mini-btn shop" id="shopBtn">🛒 Shop</button>
                        <button class="mini-btn daily ${canClaim ? 'active' : ''}" id="dailyRewardBtn" ${canClaim ? '' : 'disabled'}>🎁 Daily Reward</button>
                        <button class="mini-btn logout" id="logoutBtn">↪ Logout</button>
                    </div>
                </div>
            ` : ''}
        `;

        const domElement = this.add.dom(window.innerWidth / 2, window.innerHeight / 2).createFromHTML(html);
        domElement.setOrigin(0.5);

        // Event Listeners
        domElement.addListener('click');
        domElement.on('click', (event) => {
            const target = event.target;
            const id = target.id;

            // Play Button
            if (id === 'playBtn') {
                const nickname = domElement.getChildByID('nickname').value;
                const server = domElement.getChildByID('server').value;
                if (nickname.trim() !== '') {
                    localStorage.setItem('evoworld_nickname', nickname);
                    this.scene.start('GameScene', { nickname: nickname, server: server });
                } else {
                    domElement.getChildByID('nickname').style.borderColor = '#ff0000';
                }
            }

            // Daily Reward
            if (id === 'dailyRewardBtn' && canClaim) {
                const newXp = xp + 200;
                localStorage.setItem('evoworld_xp', newXp);
                localStorage.setItem('evoworld_daily_claim', Date.now());
                alert('You claimed 200 XP! 🎉');
                this.scene.restart();
            }

            // Open Modals
            if (id === 'openLoginBtn') {
                domElement.getChildByID('loginModal').style.display = 'block';
                domElement.getChildByID('registerModal').style.display = 'none';
            }
            if (id === 'openRegisterBtn') {
                domElement.getChildByID('registerModal').style.display = 'block';
                domElement.getChildByID('loginModal').style.display = 'none';
            }

            // Close Modals
            if (id === 'closeLogin') domElement.getChildByID('loginModal').style.display = 'none';
            if (id === 'closeRegister') domElement.getChildByID('registerModal').style.display = 'none';

            // Submit Login
            if (id === 'submitLogin') {
                const user = domElement.getChildByID('loginUser').value;
                const pass = domElement.getChildByID('loginPass').value;
                if (user && pass) {
                    localStorage.setItem('evoworld_token', 'true');
                    localStorage.setItem('evoworld_username', user);
                    this.scene.restart();
                } else {
                    alert('Please fill in all fields');
                }
            }

            // Submit Register
            if (id === 'submitRegister') {
                const email = domElement.getChildByID('regEmail').value;
                const user = domElement.getChildByID('regUser').value;
                const pass = domElement.getChildByID('regPass').value;
                if (email && user && pass) {
                    localStorage.setItem('evoworld_token', 'true');
                    localStorage.setItem('evoworld_username', user);
                    localStorage.setItem('evoworld_level', '1');
                    localStorage.setItem('evoworld_xp', '0');
                    alert('Account created! Welcome ' + user);
                    this.scene.restart();
                } else {
                    alert('Please fill in all fields');
                }
            }

            // Logout
            if (id === 'logoutBtn') {
                localStorage.removeItem('evoworld_token');
                this.scene.restart();
            }
        });

        // Load saved nickname if not logged in
        if (!isLoggedIn) {
            const savedName = localStorage.getItem('evoworld_nickname');
            if (savedName) {
                const input = domElement.getChildByID('nickname');
                if (input) input.value = savedName;
            }
        }

        // === QUICK SETTINGS FUNCTIONALITY ===
        this.initSettings(domElement);

        // === LEADERBOARD UPDATE ===
        this.loadLeaderboard(domElement);
        // Refresh leaderboard every 10 seconds
        this.time.addEvent({
            delay: 10000,
            callback: () => this.loadLeaderboard(domElement),
            loop: true
        });
    }

    // Initialize Quick Settings with localStorage
    initSettings(domElement) {
        const settingsKeys = ['sound', 'music', 'effects'];

        // Load saved settings
        settingsKeys.forEach((key, index) => {
            const saved = localStorage.getItem(`evoworld_${key}`);
            const checkbox = domElement.node.querySelectorAll('.toggle input')[index];
            if (checkbox) {
                // Default to true if not set
                checkbox.checked = saved === null ? true : saved === 'true';
            }
        });

        // Add change listeners
        const toggles = domElement.node.querySelectorAll('.toggle input');
        toggles.forEach((toggle, index) => {
            toggle.addEventListener('change', (e) => {
                const key = settingsKeys[index];
                const value = e.target.checked;
                localStorage.setItem(`evoworld_${key}`, value);

                // Update global settings
                if (window.evoAudioSettings) {
                    window.evoAudioSettings[key] = value;
                }

                // Apply setting immediately
                if (key === 'sound') {
                    // Update global sound setting
                    if (window.evoAudioSettings) window.evoAudioSettings.sound = value;
                }
                if (key === 'music') {
                    // Control background music
                    if (this.bgMusic) {
                        if (value) {
                            this.bgMusic.resume();
                        } else {
                            this.bgMusic.pause();
                        }
                    }
                }
                if (key === 'effects') {
                    // Toggle particle effects
                    if (window.evoAudioSettings) window.evoAudioSettings.effects = value;
                }

                console.log(`🔊 Setting ${key}: ${value}`);
            });
        });
    }

    // Load and display leaderboard
    async loadLeaderboard(domElement) {
        const server = domElement.getChildByID('server')?.value || 'eu1';

        // Try to fetch from API, fallback to mock data
        let leaderboardData;
        try {
            const response = await fetch(`/api/leaderboard?server=${server}`);
            if (response.ok) {
                leaderboardData = await response.json();
            } else {
                throw new Error('API not available');
            }
        } catch (error) {
            // Mock data - simulating real players
            const mockNames = [
                'xXProPlayer', 'NatureKing', 'EvoMaster', 'TreeHugger', 'Survivor99',
                'PlantGod', 'ForestLord', 'SeedMaster', 'AncientOne', 'GreenWarrior',
                'LeafStorm', 'RootKiller', 'SunEater', 'WaterKeeper', 'BiomeKing'
            ];

            // Generate random scores and shuffle
            leaderboardData = mockNames
                .slice(0, 10)
                .map(name => ({
                    name: name,
                    score: Math.floor(Math.random() * 20000) + 5000
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 5);
        }

        // Update DOM
        const leaderboardList = domElement.node.querySelector('.leaderboard-list');
        if (leaderboardList && leaderboardData) {
            leaderboardList.innerHTML = leaderboardData.map((player, index) => {
                const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
                return `
                    <div class="leaderboard-item ${rankClass}">
                        <span class="rank">${index + 1}</span>
                        <span class="name">${player.name}</span>
                        <span class="score">${player.score.toLocaleString()}</span>
                    </div>
                `;
            }).join('');
        }
    }

    // === AUDIO SYSTEM ===
    initAudio() {
        // Check saved settings
        const musicEnabled = localStorage.getItem('evoworld_music') !== 'false';
        const soundEnabled = localStorage.getItem('evoworld_sound') !== 'false';

        // Store for global access
        window.evoAudioSettings = {
            music: musicEnabled,
            sound: soundEnabled,
            effects: localStorage.getItem('evoworld_effects') !== 'false'
        };

        // Background Music
        if (!this.bgMusic) {
            this.bgMusic = this.sound.add('bgMusic', {
                volume: 0.3,
                loop: true
            });
        }

        // Start music if enabled (with user interaction workaround)
        if (musicEnabled && !this.bgMusic.isPlaying) {
            // Auto-play might be blocked, so we'll also start on first click
            this.bgMusic.play();

            // Fallback: start on user interaction
            this.input.once('pointerdown', () => {
                if (musicEnabled && !this.bgMusic.isPlaying) {
                    this.bgMusic.play();
                }
            });
        }

        // Click Sound
        this.clickSound = this.sound.add('clickSound', { volume: 0.5 });

        // Add click sound to all buttons
        this.time.delayedCall(100, () => {
            const buttons = document.querySelectorAll('button, .auth-btn, .mini-btn, .play-btn-new, .social-icon, .toggle');
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (window.evoAudioSettings?.sound) {
                        this.clickSound.play();
                    }
                });
            });
        });

        // Store sounds globally for game scene
        window.evoSounds = {
            click: this.clickSound,
            bgMusic: this.bgMusic
        };
    }
}

