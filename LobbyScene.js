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
    }

    create() {
        // 1. Full Screen Background
        const bg = this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'background');
        bg.setDisplaySize(window.innerWidth, window.innerHeight);

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

        // 2. Glowing Orbs (floating lights)
        for (let i = 0; i < 8; i++) {
            const orb = this.add.circle(
                Math.random() * window.innerWidth,
                Math.random() * window.innerHeight,
                Math.random() * 30 + 15,
                0x00ff88,
                0.15
            );
            orb.setBlendMode(Phaser.BlendModes.ADD);

            // Float animation
            this.tweens.add({
                targets: orb,
                x: orb.x + (Math.random() - 0.5) * 200,
                y: orb.y - Math.random() * 150 - 50,
                alpha: 0,
                scale: { from: 1, to: 0.3 },
                duration: 8000 + Math.random() * 4000,
                repeat: -1,
                yoyo: true,
                ease: 'Sine.easeInOut'
            });
        }

        // 3. Light Rays from top (god rays effect)
        for (let i = 0; i < 5; i++) {
            const rayX = (window.innerWidth / 6) * (i + 1);
            const ray = this.add.graphics();
            ray.fillStyle(0xffffff, 0.03);
            ray.fillTriangle(
                rayX - 50, 0,
                rayX + 50, 0,
                rayX + (Math.random() - 0.5) * 200, window.innerHeight
            );
            ray.setBlendMode(Phaser.BlendModes.ADD);

            // Subtle ray animation
            this.tweens.add({
                targets: ray,
                alpha: { from: 0.5, to: 1 },
                duration: 3000 + Math.random() * 2000,
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

        // 5. Vignette effect (dark edges)
        const vignette = this.add.graphics();
        const gradient = vignette.createGeometryMask();
        vignette.fillStyle(0x000000, 0.4);
        vignette.fillRect(0, 0, window.innerWidth, 80);
        vignette.fillRect(0, window.innerHeight - 60, window.innerWidth, 60);
        vignette.setDepth(50);

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

                <!-- Auth Corner (Top Right) - Only when Logged OUT -->
                ${!isLoggedIn ? `
                    <div class="auth-corner">
                        <button class="auth-btn btn-login" id="openLoginBtn">Log In</button>
                        <button class="auth-btn btn-register" id="openRegisterBtn">Register</button>
                    </div>
                ` : ''}

                <!-- Profile Panel (Left) - Only when Logged IN -->
                ${isLoggedIn ? `
                    <div class="profile-panel-mini">
                        <div class="mini-avatar">👤</div>
                        <div class="mini-info">
                            <span class="mini-name">${username}</span>
                            <span class="mini-level">Lv.${level}</span>
                        </div>
                        <div class="mini-xp-bar">
                            <div class="mini-xp-fill" style="width: ${xpPercent}%"></div>
                        </div>
                        <div class="mini-buttons">
                            <button class="mini-btn shop" id="shopBtn">🛒</button>
                            <button class="mini-btn daily ${canClaim ? 'active' : ''}" id="dailyRewardBtn" ${canClaim ? '' : 'disabled'}>🎁</button>
                            <button class="mini-btn logout" id="logoutBtn">↪</button>
                        </div>
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

                <!-- Socials - Bottom -->
                <div class="socials-bottom">
                    <a href="#" class="social-icon"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" class="social-icon"><i class="fa-brands fa-x-twitter"></i></a>
                    <a href="#" class="social-icon"><i class="fa-brands fa-youtube"></i></a>
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
    }
}
