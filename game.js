// EvoWorld Game Logic
import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.nickname = data.nickname || 'Player';
    }

    preload() {
        this.load.image('meadow', '/assets/meadow.png');
        this.load.image('forest', '/assets/forest.png');
        this.load.image('lake', '/assets/lake.png');
        this.load.image('volcano', '/assets/volcano.png');
        // Cactus image loaded but not used for obstacles anymore
        this.load.image('cactus', '/assets/cactus.png');

        this.load.svg('sun', '/assets/sun.svg', { width: 64, height: 64 });
        this.load.svg('carnivore', '/assets/carnivore.svg', { width: 128, height: 128 });
        this.load.svg('tree', '/assets/tree.svg', { width: 128, height: 128 });
        this.load.svg('flytrap', '/assets/flytrap.svg', { width: 128, height: 128 });
        this.load.svg('ancient_tree', '/assets/ancient_tree.svg', { width: 128, height: 128 });
        this.load.svg('seed', '/assets/seed.svg', { width: 64, height: 64 });
        this.load.svg('water', '/assets/water.svg', { width: 64, height: 64 });
        this.load.svg('soil', '/assets/soil.svg', { width: 64, height: 64 });
    }

    create() {
        try {
            // Constants
            this.MAP_WIDTH = 8000;
            this.MAP_HEIGHT = 8000;

            // Generate Biome Textures programmatically
            this.createPatternTexture('sand', 0xE6C288, 0xD4B470);
            this.createPatternTexture('snow', 0xE0F7FA, 0xB2EBF2);
            this.createPatternTexture('lava', 0x3E2723, 0xFF5722);
            this.createPatternTexture('forest_floor', 0x1B5E20, 0x2E7D32);

            // 1. Map & Biomes
            this.physics.world.setBounds(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);
            this.createBiomes();

            // 2. Decorations - REMOVED per user request
            // this.obstacles = this.physics.add.staticGroup();
            // this.decorateBiomes();

            // Volcano Feature
            // Add a base that matches the lava terrain to help blending
            this.add.image(1000, 4000, 'lava').setDepth(1).setScale(3).setAlpha(1);
            this.volcano = this.add.image(1000, 4000, 'volcano').setDepth(2).setScale(2);
            this.createVolcanoSmoke(1000, 4000);

            // 3. Player
            this.player = this.physics.add.sprite(4000, 4000, 'seed'); // Start in Center (Meadow)
            this.player.setCollideWorldBounds(true);
            this.player.setScale(0.5);
            this.player.setDepth(10);

            // Stats & Genetics
            const variantRoll = Math.random();
            let variant = 'normal';
            if (variantRoll < 0.01) variant = 'golden'; // 1% Golden
            else if (variantRoll < 0.05) variant = 'crystal'; // 4% Crystal

            this.playerStats = {
                size: 1, xp: 0, nextLevelXP: 300, hp: 100, maxHp: 100,
                water: 100, maxWater: 100, form: 'seed', path: null,
                variant: variant,
                dna: 0, // Mutation Points
                mutations: { speed: 0, health: 0, regen: 0 }
            };

            // Apply Visuals for Variant
            if (variant === 'golden') this.player.setTint(0xFFD700);
            if (variant === 'crystal') this.player.setTint(0x00FFFF);

            this.isEvolving = false;
            this.lastCombatTime = 0;
            this.lastDamageTime = 0;
            this.regenTimer = 0;

            // Weather & Atmosphere
            this.weather = 'clear';
            this.weatherTimer = 0;
            this.dayTime = 0;
            this.createRain();
            this.createAtmosphere();

            // Name Tag
            let nameText = this.nickname;
            if (variant === 'golden') nameText = '✨ ' + nameText;
            if (variant === 'crystal') nameText = '💎 ' + nameText;

            this.nameTag = this.add.text(this.player.x, this.player.y - 40, nameText, {
                fontSize: '14px', fill: '#fff', stroke: '#000', strokeThickness: 3, fontFamily: 'Arial'
            }).setOrigin(0.5).setDepth(11);

            // HP Bar Graphics
            this.hpBars = this.add.graphics().setDepth(12);

            // 4. Camera
            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
            this.cameras.main.setZoom(1);

            // 5. Resources
            this.waters = this.physics.add.group();
            this.suns = this.physics.add.group();
            this.soils = this.physics.add.group();
            this.spawnResources(800); // Increased resource count

            // 6. Bots
            this.bots = this.physics.add.group();
            this.createBots(15);

            // 7. Collisions
            this.physics.add.overlap(this.player, this.waters, this.eatWater, null, this);
            this.physics.add.overlap(this.player, this.suns, this.eatSun, null, this);
            this.physics.add.overlap(this.player, this.soils, this.eatSoil, null, this);
            this.physics.add.overlap(this.bots, this.waters, this.botEatResource, null, this);
            this.physics.add.overlap(this.bots, this.suns, this.botEatResource, null, this);
            this.physics.add.overlap(this.bots, this.soils, this.botEatResource, null, this);
            this.physics.add.collider(this.player, this.bots, this.handleCombat, null, this);
            this.physics.add.collider(this.bots, this.bots, this.handleBotCombat, null, this);
            // Obstacle collisions removed

            // 8. UI
            this.createUI();
            this.createMutationUI(); // New Mutation UI
            this.createMinimap();

            // Input
            this.input.keyboard.on('keydown-SPACE', this.useAbility, this);

            // Fix M key: Use KeyCodes directly for reliability
            this.input.keyboard.on('keydown-M', () => {
                console.log('M pressed');
                this.toggleMutationMenu();
            });
        } catch (e) {
            console.error(e);
            alert('Error in create: ' + e.message);
        }
    }

    createPatternTexture(key, color1, color2) {
        if (!this.textures.exists(key)) {
            const size = 512;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            // Base color
            ctx.fillStyle = '#' + color1.toString(16).padStart(6, '0');
            ctx.fillRect(0, 0, size, size);

            // Noise pattern
            ctx.fillStyle = '#' + color2.toString(16).padStart(6, '0');
            for (let i = 0; i < 500; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const s = Math.random() * 20 + 5;
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.arc(x, y, s, 0, Math.PI * 2);
                ctx.fill();
            }

            this.textures.addCanvas(key, canvas);
        }
    }

    createVolcanoSmoke(x, y) {
        if (!this.textures.exists('smoke')) {
            const graphics = this.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0x555555, 1);
            graphics.fillCircle(10, 10, 10);
            graphics.generateTexture('smoke', 20, 20);
        }

        const particles = this.add.particles(x, y, 'smoke', {
            speed: { min: 50, max: 150 },
            angle: { min: 250, max: 290 },
            scale: { start: 1, end: 3 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 3000,
            quantity: 1,
            frequency: 200,
            blendMode: 'NORMAL'
        });
        particles.setDepth(20);
    }

    update(time, delta) {
        try {
            if (this.isEvolving) return;

            // 1. Player Movement
            const pointer = this.input.activePointer;
            const worldPoint = pointer.positionToCamera(this.cameras.main);

            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

            // Speed Calculation (Base + Mutation)
            let baseSpeed = Math.max(100, 300 - (this.playerStats.size * 20));
            let speedMultiplier = 1 + (this.playerStats.mutations.speed * 0.05); // +5% per level
            let speed = baseSpeed * speedMultiplier;

            // Biome Mechanics
            const biome = this.getBiome(this.player.x, this.player.y);

            if (biome === 'lake' && this.playerStats.form !== 'water_spirit') speed *= 0.75;
            if (biome === 'snow' && this.playerStats.form !== 'yeti') speed *= 0.7;

            if (dist > 10) {
                const dx = worldPoint.x - this.player.x;
                const dy = worldPoint.y - this.player.y;
                const vx = (dx / dist) * speed;
                const vy = (dy / dist) * speed;
                this.player.setVelocity(vx, vy);
                this.player.setRotation(Phaser.Math.Angle.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y));
            } else {
                this.player.setVelocity(0);
            }
            this.nameTag.setPosition(this.player.x, this.player.y - (40 * this.player.scale));

            // 2. Thirst & Regen
            let thirstRate = 2;
            if (biome === 'sand') thirstRate = 3; // Reduced from 4 to 3
            this.playerStats.water -= (delta / 1000) * thirstRate;

            // Passive Regen (Mutation)
            if (this.playerStats.mutations.regen > 0) {
                this.regenTimer += delta;
                if (this.regenTimer > 1000) {
                    this.regenTimer = 0;
                    const regenAmount = this.playerStats.mutations.regen * 0.5; // 0.5 HP per level per sec
                    this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + regenAmount);
                }
            }

            // Lava Damage (Reduced frequency)
            if (biome === 'lava') {
                if (time > this.lastDamageTime + 2000) { // Increased from 1000 to 2000
                    this.playerStats.hp -= 5;
                    this.player.setTint(0xff0000);
                    this.time.delayedCall(200, () => {
                        // Restore variant tint
                        if (this.playerStats.variant === 'golden') this.player.setTint(0xFFD700);
                        else if (this.playerStats.variant === 'crystal') this.player.setTint(0x00FFFF);
                        else this.player.clearTint();
                    });
                    this.lastDamageTime = time;
                }
            }

            this.updateWeather(delta);
            this.updateAtmosphere(delta);
            this.updateHPBars(); // Draw HP Bars

            if (this.playerStats.water <= 0) {
                this.playerStats.water = 0;
                this.playerStats.hp -= (delta / 1000) * 5;
                if (this.playerStats.hp <= 0) this.killEntity(this.player, null, this.playerStats, {});
            }

            // 3. Bot Logic
            this.updateBots(time);

            // 4. UI & Resources
            this.updateUI();
            this.updateMinimap();
            this.respawnResources();
        } catch (e) {
            console.error(e);
        }
    }

    updateHPBars() {
        this.hpBars.clear();

        // Player HP Bar
        const p = this.player;
        const pStats = this.playerStats;
        const width = 100 * p.scale; // Increased width
        const height = 8;
        const x = p.x - width / 2;
        const y = p.y - (60 * p.scale); // Adjusted Y

        // Background
        this.hpBars.fillStyle(0x000000);
        this.hpBars.fillRect(x, y, width, height);

        // Health
        const hpPercent = Math.max(0, pStats.hp / pStats.maxHp);
        this.hpBars.fillStyle(0x00ff00);
        this.hpBars.fillRect(x, y, width * hpPercent, height);

        // Bots HP Bars
        this.bots.getChildren().forEach(bot => {
            if (!bot.active) return;
            const bStats = bot.getData('stats');
            const bx = bot.x - width / 2;
            const by = bot.y - (60 * bot.scale); // Adjusted Y

            this.hpBars.fillStyle(0x000000);
            this.hpBars.fillRect(bx, by, width, height);

            const bHpPercent = Math.max(0, bStats.hp / bStats.maxHp);
            this.hpBars.fillStyle(0xff0000); // Red for enemies
            this.hpBars.fillRect(bx, by, width * bHpPercent, height);
        });
    }

    getBiome(x, y) {
        const tileSize = 512;
        const tileX = Math.floor(x / tileSize) * tileSize;
        const tileY = Math.floor(y / tileSize) * tileSize;

        const scale = 0.0005;
        const noise = Math.sin(tileX * scale) + Math.cos(tileY * scale);

        const dSnow = Phaser.Math.Distance.Between(tileX, tileY, 4000, 0) + (noise * 500);
        const dForest = Phaser.Math.Distance.Between(tileX, tileY, 4000, 8000) + (noise * 500);
        const dLava = Phaser.Math.Distance.Between(tileX, tileY, 0, 4000) + (noise * 500);
        const dDesert = Phaser.Math.Distance.Between(tileX, tileY, 8000, 4000) + (noise * 500);
        const dMeadow = Phaser.Math.Distance.Between(tileX, tileY, 4000, 4000);

        if (dMeadow < 2500) {
            const lakeNoise = Math.sin(tileX * 0.002) + Math.cos(tileY * 0.002);
            if (lakeNoise > 1.2) return 'lake';
            return 'meadow';
        }

        const min = Math.min(dSnow, dForest, dLava, dDesert);
        if (min === dLava) return 'lava';
        if (min === dDesert) return 'sand';
        if (min === dSnow) return 'snow';
        if (min === dForest) return 'forest';

        return 'meadow';
    }

    createAtmosphere() {
        this.dayNightOverlay = this.add.rectangle(window.innerWidth / 2, window.innerHeight / 2, 10000, 10000, 0x000044)
            .setScrollFactor(0).setDepth(150).setAlpha(0).setBlendMode(Phaser.BlendModes.MULTIPLY);

        if (!this.textures.exists('vignette')) {
            const graphics = this.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0x000000, 1);
            graphics.fillRect(0, 0, 800, 600);
            graphics.generateTexture('vignette', 800, 600);
        }

        this.fogOverlay = this.add.image(window.innerWidth / 2, window.innerHeight / 2, 'vignette')
            .setScrollFactor(0).setDepth(190).setDisplaySize(10000, 10000).setAlpha(0);
    }

    createRain() {
        if (!this.textures.exists('rain_drop')) {
            const graphics = this.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0x00ffff, 1);
            graphics.fillRect(0, 0, 4, 15);
            graphics.lineStyle(2, 0xffffff, 1);
            graphics.strokeRect(0, 0, 4, 15);
            graphics.generateTexture('rain_drop', 6, 17);
        }

        this.rainParticles = this.add.particles(0, 0, 'rain_drop', {
            x: { min: 0, max: window.innerWidth },
            y: -50,
            lifespan: 2500,
            speedY: { min: 500, max: 700 },
            speedX: { min: -20, max: 20 },
            scale: { start: 1, end: 1 },
            quantity: 4,
            frequency: 20,
            alpha: { start: 1, end: 0.8 },
        });
        this.rainParticles.setScrollFactor(0);
        this.rainParticles.setDepth(199);
        this.rainParticles.stop();
    }

    updateAtmosphere(delta) {
        this.dayTime += delta / 1000;
        if (this.dayTime > 300) this.dayTime = 0;
        let targetAlpha = 0;
        if (this.dayTime > 150) {
            if (this.dayTime < 225) targetAlpha = (this.dayTime - 150) / 75 * 0.7;
            else targetAlpha = (300 - this.dayTime) / 75 * 0.7;
        }
        if (this.dayNightOverlay) this.dayNightOverlay.setAlpha(targetAlpha);

        const biome = this.getBiome(this.player.x, this.player.y);
        if (biome === 'forest') {
            this.fogOverlay.setAlpha(0.5);
        } else {
            this.fogOverlay.setAlpha(0);
        }
    }

    updateWeather(delta) {
        this.weatherTimer += delta;
        if (this.weatherTimer > 60000) {
            this.weatherTimer = 0;
            if (this.weather === 'clear') {
                this.weather = 'rain';
                this.rainParticles.start();
                this.weatherText.setText('Weather: RAIN 🌧️');
                this.weatherText.setColor('#00ffff');
                this.spawnResource('water', true);
                this.spawnResource('water', true);
                this.spawnResource('water', true);
            } else {
                this.weather = 'clear';
                this.rainParticles.stop();
                this.weatherText.setText('Weather: CLEAR ☀️');
                this.weatherText.setColor('#ffff00');
            }
        }
        if (this.weather === 'rain') {
            this.playerStats.water = Math.min(this.playerStats.maxWater, this.playerStats.water + (delta / 1000) * 5);
        }
    }

    createBiomes() {
        const tileSize = 512;
        const cols = Math.ceil(this.MAP_WIDTH / tileSize);
        const rows = Math.ceil(this.MAP_HEIGHT / tileSize);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const posX = x * tileSize;
                const posY = y * tileSize;

                const biome = this.getBiome(posX + tileSize / 2, posY + tileSize / 2);
                let texture = biome;

                if (biome === 'forest') texture = 'forest_floor';

                this.add.image(posX, posY, texture).setOrigin(0).setDisplaySize(tileSize, tileSize).setDepth(0);
            }
        }
    }

    createUI() {
        // Bottom Center Layout
        const barWidth = 400;
        const centerX = window.innerWidth / 2;
        const bottomY = window.innerHeight - 80;

        this.formText = this.add.text(centerX, bottomY - 40, 'Form: SEED', {
            fontSize: '24px', fill: '#ffd700', stroke: '#000', strokeThickness: 4, fontStyle: 'bold'
        }).setScrollFactor(0).setOrigin(0.5).setDepth(200);

        // XP Bar
        this.xpBarBg = this.add.rectangle(centerX - barWidth / 2, bottomY, barWidth, 15, 0x333333).setScrollFactor(0).setOrigin(0).setDepth(200);
        this.xpBarFill = this.add.rectangle(centerX - barWidth / 2, bottomY, 0, 15, 0x00ff00).setScrollFactor(0).setOrigin(0).setDepth(201);
        this.xpText = this.add.text(centerX, bottomY + 8, 'XP: 0 / 300', { fontSize: '12px', fill: '#fff', fontStyle: 'bold' }).setScrollFactor(0).setOrigin(0.5).setDepth(202);

        // Water Bar
        this.waterBarBg = this.add.rectangle(centerX - barWidth / 2, bottomY + 20, barWidth, 15, 0x333333).setScrollFactor(0).setOrigin(0).setDepth(200);
        this.waterBarFill = this.add.rectangle(centerX - barWidth / 2, bottomY + 20, barWidth, 15, 0x2196F3).setScrollFactor(0).setOrigin(0).setDepth(201);
        this.waterText = this.add.text(centerX, bottomY + 28, 'Water: 100%', { fontSize: '12px', fill: '#fff', fontStyle: 'bold' }).setScrollFactor(0).setOrigin(0.5).setDepth(202);

        this.weatherText = this.add.text(window.innerWidth - 270, window.innerHeight - 300, 'Weather: CLEAR ☀️', {
            fontSize: '16px', fill: '#ffff00', fontStyle: 'bold', stroke: '#000', strokeThickness: 2
        }).setScrollFactor(0).setDepth(200);

        const lbX = 20;
        const lbY = 100;
        this.add.rectangle(lbX + 100, lbY + 140, 220, 300, 0x000000, 0.5).setScrollFactor(0).setStrokeStyle(2, 0xffd700).setDepth(200);
        this.add.text(lbX + 110, lbY + 10, '🏆 Leaderboard', { fontSize: '20px', fill: '#ffd700', fontStyle: 'bold', stroke: '#000', strokeThickness: 2 }).setScrollFactor(0).setOrigin(0.5, 0).setDepth(201);

        this.leaderboardEntries = [];
        for (let i = 0; i < 10; i++) {
            this.leaderboardEntries.push(this.add.text(lbX + 110, lbY + 45 + (i * 25), '', { fontSize: '14px', fill: '#fff', stroke: '#000', strokeThickness: 2 }).setScrollFactor(0).setOrigin(0.5, 0).setDepth(201));
        }

        // Mutation Menu Button (Visual indicator)
        this.mutationBtn = this.add.text(window.innerWidth - 150, window.innerHeight - 50, '[ M ] Mutations', {
            fontSize: '18px', fill: '#00ff00', backgroundColor: '#000', padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(200).setInteractive();
        this.mutationBtn.on('pointerdown', () => this.toggleMutationMenu());
    }

    createMutationUI() {
        // Hidden by default
        this.mutationContainer = this.add.container(window.innerWidth / 2, window.innerHeight / 2).setScrollFactor(0).setDepth(300).setVisible(false);

        const bg = this.add.rectangle(0, 0, 500, 400, 0x111111, 0.9).setStrokeStyle(4, 0x00ff00);
        const title = this.add.text(0, -160, '🧬 MUTATIONS 🧬', { fontSize: '32px', fill: '#00ff00', fontStyle: 'bold' }).setOrigin(0.5);

        this.dnaText = this.add.text(0, -110, 'DNA Points: 0', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

        // Upgrade Buttons
        this.createUpgradeRow(0, -50, 'Speed (+5%)', 'speed');
        this.createUpgradeRow(0, 20, 'Max HP (+10)', 'health');
        this.createUpgradeRow(0, 90, 'Regen (+0.5/s)', 'regen');

        const closeBtn = this.add.text(0, 160, '[ Close (M) ]', { fontSize: '20px', fill: '#aaa' }).setOrigin(0.5).setInteractive();
        closeBtn.on('pointerdown', () => this.toggleMutationMenu());

        this.mutationContainer.add([bg, title, this.dnaText, closeBtn]);
    }

    createUpgradeRow(x, y, label, stat) {
        const text = this.add.text(x - 150, y, label, { fontSize: '20px', fill: '#fff' }).setOrigin(0, 0.5);
        const valText = this.add.text(x + 50, y, 'Lvl 0', { fontSize: '20px', fill: '#00ff00' }).setOrigin(0.5);
        const btn = this.add.rectangle(x + 150, y, 40, 40, 0x333333).setInteractive();
        const btnText = this.add.text(x + 150, y, '+', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

        btn.on('pointerdown', () => this.buyMutation(stat, valText));

        this.mutationContainer.add([text, valText, btn, btnText]);
    }

    toggleMutationMenu() {
        this.mutationContainer.setVisible(!this.mutationContainer.visible);
        if (this.mutationContainer.visible) {
            this.dnaText.setText(`DNA Points: ${this.playerStats.dna}`);
        }
    }

    buyMutation(stat, valText) {
        if (this.playerStats.dna > 0) {
            this.playerStats.dna--;
            this.playerStats.mutations[stat]++;
            this.dnaText.setText(`DNA Points: ${this.playerStats.dna}`);
            valText.setText(`Lvl ${this.playerStats.mutations[stat]}`);

            // Apply immediate effects
            if (stat === 'health') {
                this.playerStats.maxHp += 10;
                this.playerStats.hp += 10;
            }
        }
    }

    createMinimap() {
        this.minimapSize = 250;
        const ox = window.innerWidth - 20 - this.minimapSize;
        const oy = window.innerHeight - 20 - this.minimapSize;

        this.minimapBg = this.add.graphics().setScrollFactor(0).setDepth(200);
        this.minimapBg.lineStyle(2, 0xffffff);
        this.minimapBg.strokeRect(ox, oy, this.minimapSize, this.minimapSize);

        const mapScale = this.minimapSize / this.MAP_WIDTH;
        const tileSize = 512;
        const cols = Math.ceil(this.MAP_WIDTH / tileSize);
        const rows = Math.ceil(this.MAP_HEIGHT / tileSize);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const posX = x * tileSize;
                const posY = y * tileSize;

                let color = 0x4CAF50; // Meadow
                const biome = this.getBiome(posX + tileSize / 2, posY + tileSize / 2);

                if (biome === 'lava') color = 0x3E2723;
                else if (biome === 'sand') color = 0xE6C288;
                else if (biome === 'snow') color = 0xE0F7FA;
                else if (biome === 'forest') color = 0x1B5E20;
                else if (biome === 'lake') color = 0x2196F3;

                this.minimapBg.fillStyle(color);
                this.minimapBg.fillRect(ox + (posX * mapScale), oy + (posY * mapScale), Math.ceil(tileSize * mapScale), Math.ceil(tileSize * mapScale));
            }
        }
        this.minimapDots = this.add.graphics().setScrollFactor(0).setDepth(201);
        this.minimapPlayer = this.add.circle(0, 0, 4, 0x00ff00).setScrollFactor(0).setDepth(202);
    }

    updateMinimap() {
        const mapScale = this.minimapSize / this.MAP_WIDTH;
        const ox = window.innerWidth - 20 - this.minimapSize;
        const oy = window.innerHeight - 20 - this.minimapSize;

        this.minimapPlayer.setPosition(ox + (this.player.x * mapScale), oy + (this.player.y * mapScale));
        this.minimapDots.clear();

        this.minimapDots.fillStyle(0x2196F3);
        this.waters.getChildren().forEach(r => r.active && this.minimapDots.fillPoint(ox + r.x * mapScale, oy + r.y * mapScale, 2));
        this.minimapDots.fillStyle(0xFFEB3B);
        this.suns.getChildren().forEach(r => r.active && this.minimapDots.fillPoint(ox + r.x * mapScale, oy + r.y * mapScale, 2));
        this.minimapDots.fillStyle(0xFF0000);
        this.bots.getChildren().forEach(b => b.active && this.minimapDots.fillPoint(ox + b.x * mapScale, oy + b.y * mapScale, 3));
    }

    createBots(count) {
        const names = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron'];
        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(100, this.MAP_WIDTH - 100);
            const y = Phaser.Math.Between(100, this.MAP_HEIGHT - 100);
            const bot = this.bots.create(x, y, 'seed');
            bot.setScale(0.5);
            bot.setCollideWorldBounds(true);

            // Bot Genetics
            const variantRoll = Math.random();
            let variant = 'normal';
            if (variantRoll < 0.01) variant = 'golden';
            else if (variantRoll < 0.05) variant = 'crystal';

            if (variant === 'golden') bot.setTint(0xFFD700);
            if (variant === 'crystal') bot.setTint(0x00FFFF);

            bot.setData('stats', {
                name: names[i] || `Bot${i}`,
                xp: 0, size: 1, hp: 100, maxHp: 100, form: 'seed',
                variant: variant
            });

            let nameText = bot.getData('stats').name;
            if (variant === 'golden') nameText = '✨ ' + nameText;
            if (variant === 'crystal') nameText = '💎 ' + nameText;

            bot.nameTag = this.add.text(x, y - 40, nameText, { fontSize: '14px', fill: '#aaa', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(11);
        }
    }

    updateBots(time) {
        this.bots.getChildren().forEach(bot => {
            if (!bot.active) return;
            const stats = bot.getData('stats');
            if (!bot.target || Math.random() < 0.01) {
                bot.target = new Phaser.Math.Vector2(Phaser.Math.Between(0, this.MAP_WIDTH), Phaser.Math.Between(0, this.MAP_HEIGHT));
            }
            this.physics.moveToObject(bot, bot.target, 100);
            bot.nameTag.setPosition(bot.x, bot.y - 40);
            if (stats.xp > 300 && stats.form === 'seed') {
                stats.form = Math.random() > 0.5 ? 'carnivore' : 'tree';
                bot.setTexture(stats.form);
                stats.size = 1.5;
                bot.setScale(0.5 * stats.size);
            }
        });
    }

    useAbility() {
        if (this.playerStats.form === 'seed') return;
        if (this.playerStats.path === 'evil') {
            if (this.playerStats.water >= 20) {
                this.playerStats.water -= 20;
                const angle = this.player.rotation;
                this.player.body.setVelocity(Math.cos(angle) * 800, Math.sin(angle) * 800);
            }
        } else if (this.playerStats.path === 'peace') {
            if (this.playerStats.water >= 20) {
                this.playerStats.water -= 20;
                this.player.setTint(0x00ffff);
                this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + 20);
                this.time.delayedCall(1000, () => {
                    // Restore variant tint
                    if (this.playerStats.variant === 'golden') this.player.setTint(0xFFD700);
                    else if (this.playerStats.variant === 'crystal') this.player.setTint(0x00FFFF);
                    else this.player.clearTint();
                });
            }
        }
    }

    handleCombat(player, bot) { this.resolveCombat(player, bot, this.playerStats, bot.getData('stats')); }
    handleBotCombat(bot1, bot2) { this.resolveCombat(bot1, bot2, bot1.getData('stats'), bot2.getData('stats')); }

    resolveCombat(entity1, entity2, stats1, stats2) {
        if (this.time.now - this.lastCombatTime < 500) return;
        this.lastCombatTime = this.time.now;
        const attacker = stats1.size > stats2.size ? entity1 : (stats2.size > stats1.size ? entity2 : null);
        const defender = attacker === entity1 ? entity2 : entity1;
        if (!attacker) return;
        const defStats = attacker === entity1 ? stats2 : stats1;
        const attStats = attacker === entity1 ? stats1 : stats2;

        let damage = defStats.maxHp / 4;

        // Crystal Defense
        if (defStats.variant === 'crystal') damage *= 0.8; // 20% reduction

        defStats.hp -= damage;
        const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, defender.x, defender.y);
        defender.body.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
        attacker.body.setVelocity(Math.cos(angle + Math.PI) * 100, Math.sin(angle + Math.PI) * 100);
        defender.setTint(0xff0000);
        this.time.delayedCall(200, () => {
            // Restore variant tint
            if (defStats.variant === 'golden') defender.setTint(0xFFD700);
            else if (defStats.variant === 'crystal') defender.setTint(0x00FFFF);
            else defender.clearTint();
        });
        if (defStats.hp <= 0) this.killEntity(defender, attacker, defStats, attStats);
    }

    killEntity(victim, killer, victimStats, killerStats) {
        if (killer) {
            const xpGain = Math.floor(victimStats.xp * 0.75);
            killerStats.xp += xpGain;
            if (killer === this.player) this.gainXP(0); // Trigger level up check
            else killer.setData('stats', killerStats);
        }
        victim.destroy();
        if (victim.nameTag) victim.nameTag.destroy();
        if (victim !== this.player) {
            this.time.delayedCall(3000, () => this.createBots(1));
        } else {
            alert('You died! Respawning...');
            location.reload();
        }
    }

    eatWater(player, water) {
        this.handleResourceEat(player, water, 'water');
    }
    eatSun(player, sun) { this.handleResourceEat(player, sun, 'sun'); }
    eatSoil(player, soil) { this.handleResourceEat(player, soil, 'soil'); }

    handleResourceEat(player, res, type) {
        // Hard Resource Logic
        if (res.getData('isHard')) {
            const now = this.time.now;
            const lastHit = res.getData('lastHit') || 0;

            if (now - lastHit < 500) return; // 500ms cooldown
            res.setData('lastHit', now);

            let hp = res.getData('hp');
            hp--;
            res.setData('hp', hp);
            res.setAlpha(0.5 + (hp / 10)); // Visual feedback

            // Pushback
            const angle = Phaser.Math.Angle.Between(player.x, player.y, res.x, res.y);
            player.setVelocity(Math.cos(angle + Math.PI) * 400, Math.sin(angle + Math.PI) * 400); // Stronger pushback

            if (hp <= 0) {
                res.disableBody(true, true);
                this.gainXP(50); // Big XP (Increased to 50)
                const txt = this.add.text(res.x, res.y, '+50 XP!', { fontSize: '24px', fill: '#ff00ff', stroke: '#fff', strokeThickness: 2 }).setDepth(50);
                this.tweens.add({ targets: txt, y: res.y - 50, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
            }
            return;
        }

        res.disableBody(true, true);
        const isSuper = res.getData('isSuper');
        let xp = isSuper ? 15 : 5;
        if (type === 'sun') xp = 8;
        if (type === 'soil') xp = 3;

        const waterGain = (type === 'water') ? (isSuper ? 30 : 10) : 0;

        this.gainXP(xp);
        this.playerStats.water = Math.min(this.playerStats.maxWater, this.playerStats.water + waterGain);

        if (isSuper) {
            const txt = this.add.text(player.x, player.y - 50, '+SUPER!', { fontSize: '20px', fill: '#ffd700', stroke: '#000', strokeThickness: 4 }).setDepth(50);
            this.tweens.add({ targets: txt, y: player.y - 100, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
        }
    }

    botEatResource(bot, res) {
        if (res.getData('isHard')) return; // Bots ignore hard resources for now
        res.disableBody(true, true);
        const stats = bot.getData('stats');
        stats.xp += 5;
        bot.setData('stats', stats);
    }

    spawnResources(count) {
        for (let i = 0; i < count; i++) {
            this.spawnResource('water');
            this.spawnResource('sun');
            this.spawnResource('soil');
        }
    }

    spawnResource(type, isSuper = false) {
        const x = Phaser.Math.Between(0, this.MAP_WIDTH);
        const y = Phaser.Math.Between(0, this.MAP_HEIGHT);
        let group = type === 'water' ? this.waters : (type === 'sun' ? this.suns : this.soils);
        const res = group.create(x, y, type).setScale(0.5);

        // Hard Resource Chance (1%)
        if (Math.random() < 0.01) {
            res.setTint(0x880088); // Purple tint for Hard
            res.setData('isHard', true);
            res.setData('hp', 5);
            res.setScale(1.2);
            return;
        }

        if (isSuper && type === 'water') {
            res.setTint(0xffd700);
            res.setData('isSuper', true);
            res.setScale(0.8);
        }
    }

    respawnResources() {
        if (this.waters.countActive(true) < 300) this.spawnResource('water');
        if (this.suns.countActive(true) < 300) this.spawnResource('sun');
        if (this.soils.countActive(true) < 300) this.spawnResource('soil');
    }

    gainXP(amount) {
        // Golden Multiplier
        if (this.playerStats.variant === 'golden') amount *= 2;

        this.playerStats.xp += amount;
        if (this.playerStats.xp >= this.playerStats.nextLevelXP) this.triggerEvolution();
    }

    triggerEvolution() {
        this.isEvolving = true;

        // Award DNA Point
        this.playerStats.dna++;
        if (this.mutationContainer && this.mutationContainer.visible) {
            this.dnaText.setText(`DNA Points: ${this.playerStats.dna}`);
        }

        this.player.setVelocity(0);
        const overlay = this.add.rectangle(0, 0, window.innerWidth, window.innerHeight, 0x000000, 0.9).setScrollFactor(0).setOrigin(0).setDepth(30);
        const title = this.add.text(window.innerWidth / 2, 100, 'EVOLUTION TIME', { fontSize: '48px', fill: '#fff' }).setScrollFactor(0).setOrigin(0.5).setDepth(31);

        const dnaMsg = this.add.text(window.innerWidth / 2, 160, '+1 DNA POINT!', { fontSize: '24px', fill: '#00ff00', fontStyle: 'bold' }).setScrollFactor(0).setOrigin(0.5).setDepth(31);

        if (this.playerStats.form === 'seed') {
            this.createEvoCard(window.innerWidth / 2 - 200, window.innerHeight / 2, 'carnivore', 'EVIL', 'Ability: Dash\nCost: Water', () => this.evolveTo('carnivore', 'evil', overlay, title, dnaMsg));
            this.createEvoCard(window.innerWidth / 2 + 200, window.innerHeight / 2, 'tree', 'PEACE', 'Ability: Heal\nCost: Water', () => this.evolveTo('tree', 'peace', overlay, title, dnaMsg));
        } else {
            const nextForm = this.playerStats.path === 'evil' ? 'flytrap' : 'ancient_tree';
            const name = this.playerStats.path === 'evil' ? 'Venus Flytrap' : 'Ancient Tree';
            this.createEvoCard(window.innerWidth / 2, window.innerHeight / 2, nextForm, name, 'Ultimate Power', () => this.evolveTo(nextForm, this.playerStats.path, overlay, title, dnaMsg));
        }
    }

    createEvoCard(x, y, texture, name, desc, onClick) {
        const bg = this.add.rectangle(x, y, 300, 400, 0x222222).setScrollFactor(0).setInteractive().setDepth(31).setStrokeStyle(4, 0x444444);
        const img = this.add.image(x, y - 50, texture).setScrollFactor(0).setDepth(32).setDisplaySize(128, 128);
        const t = this.add.text(x, y + 50, name, { fontSize: '32px', fill: name === 'EVIL' ? '#f00' : '#0f0' }).setScrollFactor(0).setOrigin(0.5).setDepth(32);
        const d = this.add.text(x, y + 100, desc, { fontSize: '16px', fill: '#ccc', align: 'center' }).setScrollFactor(0).setOrigin(0.5).setDepth(32);
        bg.on('pointerdown', onClick);
        this.evoUI = this.evoUI || [];
        this.evoUI.push(bg, img, t, d);
    }

    evolveTo(form, path, overlay, title, dnaMsg) {
        overlay.destroy();
        title.destroy();
        dnaMsg.destroy();
        if (this.evoUI) this.evoUI.forEach(el => el.destroy());
        this.evoUI = [];
        this.player.setTexture(form);
        this.playerStats.form = form;
        this.playerStats.path = path;
        this.playerStats.size += 0.5;
        this.player.setScale(0.5 * this.playerStats.size);
        this.playerStats.nextLevelXP = Math.floor(this.playerStats.nextLevelXP * 2.5);
        this.isEvolving = false;
        this.formText.setText('Form: ' + form.toUpperCase());
    }

    updateUI() {
        const xpProg = Math.min(1, this.playerStats.xp / this.playerStats.nextLevelXP);
        this.xpBarFill.width = 400 * xpProg;
        this.xpText.setText(`XP: ${this.playerStats.xp} / ${this.playerStats.nextLevelXP}`);
        const waterProg = Math.min(1, this.playerStats.water / this.playerStats.maxWater);
        this.waterBarFill.width = 400 * waterProg;
        this.waterText.setText(`Water: ${Math.floor(this.playerStats.water)}%`);
        let all = [{ name: this.nickname, xp: this.playerStats.xp, isMe: true }];
        this.bots.getChildren().forEach(b => {
            if (b.active) all.push({ name: b.getData('stats').name, xp: b.getData('stats').xp, isMe: false });
        });
        all.sort((a, b) => b.xp - a.xp);
        for (let i = 0; i < 10; i++) {
            if (all[i]) {
                this.leaderboardEntries[i].setText(`${i + 1}. ${all[i].name}: ${all[i].xp}`);
                this.leaderboardEntries[i].setColor(all[i].isMe ? '#0f0' : '#fff');
            } else {
                this.leaderboardEntries[i].setText('');
            }
        }
    }
}
