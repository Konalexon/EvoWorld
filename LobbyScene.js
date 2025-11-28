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
                        <button class="auth-btn btn-login" id="openLoginBtn">Log In</button>
                        <button class="auth-btn btn-register" id="openRegisterBtn">Register</button>
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
                    // Simulate API call
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
                    // Simulate API call
                    localStorage.setItem('evoworld_token', 'true');
                    localStorage.setItem('evoworld_username', user);
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
