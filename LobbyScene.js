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

                <!-- Main Card -->
                <div class="menu-card">
                    <h1 class="menu-title">EvoWorld.io</h1>
                    
                    <div class="input-group">
                        <label class="input-label">NICKNAME</label>
                        <input type="text" id="nickname" class="menu-input" placeholder="Enter your name..." maxlength="15">
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

                    <div class="extra-buttons">
                        <button class="small-btn">👕 Skins</button>
                        <button class="small-btn">⚙️ Settings</button>
                        <button class="small-btn">🏆 Rank</button>
                    </div>

                    <div class="socials">
                        <a href="#" class="social-btn discord">💬</a>
                        <a href="#" class="social-btn twitter">🐦</a>
                        <a href="#" class="social-btn youtube">▶️</a>
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
            if (event.target.id === 'playBtn') {
                const nicknameInput = domElement.getChildByID('nickname');
                const serverInput = domElement.getChildByID('server');

                const nickname = nicknameInput.value;
                const server = serverInput.value;

                if (nickname.trim() !== '') {
                    // Save nickname
                    localStorage.setItem('evoworld_nickname', nickname);
                    this.scene.start('GameScene', { nickname: nickname, server: server });
                } else {
                    nicknameInput.style.borderColor = '#ff0000';
                    nicknameInput.placeholder = 'Nickname required!';
                    setTimeout(() => {
                        nicknameInput.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        nicknameInput.placeholder = 'Enter your name...';
                    }, 1000);
                }
            }
        });

        // Load saved nickname
        const savedName = localStorage.getItem('evoworld_nickname');
        if (savedName) {
            const input = domElement.getChildByID('nickname');
            if (input) input.value = savedName;
        }
    }
}
