import Phaser from 'phaser';

export default class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' });
    }

    preload() {
        this.load.image('background', '/assets/background.png');
    }

    create() {
        // 1. Dynamic Background
        this.add.tileSprite(0, 0, window.innerWidth, window.innerHeight, 'background').setOrigin(0).setTint(0x888888);

        // Floating Particles
        const particles = this.add.particles(0, 0, 'background', {
            x: { min: 0, max: window.innerWidth },
            y: { min: 0, max: window.innerHeight },
            scale: { start: 0.02, end: 0 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 4000,
            speedY: { min: -20, max: -50 },
            quantity: 2,
            frequency: 100,
            tint: 0x00ff00,
            blendMode: 'ADD'
        });

        // Check Login State (Mock)
        const isLoggedIn = localStorage.getItem('evoworld_token') === 'true';
        const username = localStorage.getItem('evoworld_username') || 'Guest';
        const level = 5; // Mock
        const xp = 750; // Mock
        const maxXp = 1000;
        const xpPercent = (xp / maxXp) * 100;

        // 2. HTML UI
        const html = `
            <div class="menu-overlay">
                <!-- Changelog -->
                <div class="changelog-box">
                    <div class="changelog-title">📢 Latest Updates (v0.4.0)</div>
                    <ul style="padding-left: 20px; margin: 0;">
                        <li>🧬 Mutation System Added!</li>
                        <li>💎 Rare Genetics (Golden/Crystal)</li>
                        <li>🌋 Volcano Biome & Lava</li>
                        <li>📊 New HP Bars & UI</li>
                    </ul>
                </div>

                <!-- Auth Corner (Top Right) - Only when Logged OUT -->
                ${!isLoggedIn ? `
                    <div class="auth-corner">
                        <button class="auth-btn btn-login" id="loginBtn">Log In</button>
                        <button class="auth-btn btn-register" id="registerBtn">Register</button>
                    </div>
                ` : ''}

                <!-- Profile Panel (Left) - Only when Logged IN -->
                ${isLoggedIn ? `
                    <div class="profile-panel">
                        <div class="profile-header">
                            <div class="avatar">👤</div>
                            <div class="user-info">
                                <h3>${username}</h3>
                                <p>Level ${level}</p>
                            </div>
                        </div>
                        <div class="xp-container">
                            <div class="xp-label">
                                <span>XP</span>
                                <span>${xp} / ${maxXp}</span>
                            </div>
                            <div class="xp-bar-bg">
                                <div class="xp-bar-fill" style="width: ${xpPercent}%"></div>
                            </div>
                        </div>
                        <button class="shop-btn" id="shopBtn">🛒 Skin Shop</button>
                        <button class="small-btn" id="logoutBtn" style="margin-top: 10px; width: 100%; background: #333; border: none; color: #aaa; cursor: pointer;">Logout</button>
                    </div>
                ` : ''}

                <!-- Main Card -->
                <div class="menu-card">
                    <h1 class="menu-title">EvoWorld.io</h1>
                    
                    <div class="input-group">
                        <label class="input-label">NICKNAME</label>
                        <input type="text" id="nickname" class="menu-input" placeholder="Enter your name..." maxlength="15" value="${isLoggedIn ? username : ''}">
                    </div>

                    <div class="input-group">
                        <label class="input-label">REGION</label>
                        <select id="server" class="menu-select">
                            <option value="eu1">🇪🇺 Europe 1 (Recommended)</option>
                            <option value="eu2">🇪🇺 Europe 2</option>
                            <option value="us1">🇺🇸 US East</option>
                            <option value="us2">🇺🇸 US West</option>
                            <option value="asia">🌏 Asia Pacific</option>
                        </select>
                    </div>

                    <button id="playBtn" class="play-btn">PLAY NOW</button>

                    <div class="socials">
                        <a href="#" class="social-btn facebook"><i class="fa-brands fa-facebook-f"></i></a>
                        <a href="#" class="social-btn twitter"><i class="fa-brands fa-x-twitter"></i></a>
                        <a href="#" class="social-btn youtube"><i class="fa-brands fa-youtube"></i></a>
                    </div>
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

            if (target.id === 'playBtn') {
                const nicknameInput = domElement.getChildByID('nickname');
                const serverInput = domElement.getChildByID('server');
                const nickname = nicknameInput.value;
                const server = serverInput.value;

                if (nickname.trim() !== '') {
                    localStorage.setItem('evoworld_nickname', nickname);
                    this.scene.start('GameScene', { nickname: nickname, server: server });
                } else {
                    nicknameInput.style.borderColor = '#ff0000';
                }
            }

            // Mock Auth Logic
            if (target.id === 'loginBtn') {
                const name = prompt("Enter username (Mock Login):", "SpartianinKolki");
                if (name) {
                    localStorage.setItem('evoworld_token', 'true');
                    localStorage.setItem('evoworld_username', name);
                    this.scene.restart(); // Reload scene to update UI
                }
            }

            if (target.id === 'logoutBtn') {
                localStorage.removeItem('evoworld_token');
                this.scene.restart();
            }

            if (target.id === 'shopBtn') {
                alert('Skin Shop coming soon in Phase 9!');
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
