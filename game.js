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
            this.createTexture('sand', 0xE6C288);
            this.createTexture('snow', 0xE0F7FA);
            this.createTexture('lava', 0x3E2723);

            // 1. Map & Biomes
            this.physics.world.setBounds(0, 0, this.MAP_WIDTH, this.MAP_HEIGHT);
            this.createBiomes();

            // 2. Player
            this.player = this.physics.add.sprite(2000, 2000, 'seed'); // Start in Meadow
            this.player.setCollideWorldBounds(true);
            this.player.setScale(0.5);
            this.player.setDepth(10);

            // Stats
            this.playerStats = {
                size: 1, xp: 0, nextLevelXP: 300, hp: 100, maxHp: 100,
                water: 100, maxWater: 100, form: 'seed', path: null
            };

            this.isEvolving = false;
            this.lastCombatTime = 0;
            this.lastDamageTime = 0;

            // Weather & Atmosphere
            this.weather = 'clear';
            this.weatherTimer = 0;
            this.dayTime = 0;
            this.createRain();
            this.createAtmosphere();

            // Name Tag
            this.nameTag = this.add.text(this.player.x, this.player.y - 40, this.nickname, {
                fontSize: '14px', fill: '#fff', stroke: '#000', strokeThickness: 3, fontFamily: 'Arial'
            }).setOrigin(0.5).setDepth(11);

            // 3. Camera
            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
            this.cameras.main.setZoom(1);

            // 4. Resources
            this.waters = this.physics.add.group();
            this.suns = this.physics.add.group();
            this.soils = this.physics.add.group();
            this.spawnResources(600);

            // 5. Bots
            this.bots = this.physics.add.group();
            this.createBots(15);

            // 6. Collisions
            this.physics.add.overlap(this.player, this.waters, this.eatWater, null, this);
            this.physics.add.overlap(this.player, this.suns, this.eatSun, null, this);
            this.physics.add.overlap(this.player, this.soils, this.eatSoil, null, this);
            this.physics.add.overlap(this.bots, this.waters, this.botEatResource, null, this);
            this.physics.add.overlap(this.bots, this.suns, this.botEatResource, null, this);
            this.physics.add.overlap(this.bots, this.soils, this.botEatResource, null, this);
            this.physics.add.collider(this.player, this.bots, this.handleCombat, null, this);
            this.physics.add.collider(this.bots, this.bots, this.handleBotCombat, null, this);

            // 7. UI
            this.createUI();
            this.createMinimap();

            // Input
            this.input.keyboard.on('keydown-SPACE', this.useAbility, this);
        } catch (e) {
            console.error(e);
            alert('Error in create: ' + e.message);
        }
    }

    createTexture(key, color) {
        if (!this.textures.exists(key)) {
            const graphics = this.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(color, 1);
            graphics.fillRect(0, 0, 512, 512);
            graphics.generateTexture(key, 512, 512);
        }
    }

    update(time, delta) {
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
        bot.setData('stats', { name: names[i] || `Bot${i}`, xp: 0, size: 1, hp: 100, maxHp: 100, form: 'seed' });
        bot.nameTag = this.add.text(x, y - 40, bot.getData('stats').name, { fontSize: '14px', fill: '#aaa', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(11);
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
            this.time.delayedCall(1000, () => this.player.clearTint());
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
    const damage = defStats.maxHp / 4;
    defStats.hp -= damage;
    const angle = Phaser.Math.Angle.Between(attacker.x, attacker.y, defender.x, defender.y);
    defender.body.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
    attacker.body.setVelocity(Math.cos(angle + Math.PI) * 100, Math.sin(angle + Math.PI) * 100);
    defender.setTint(0xff0000);
    this.time.delayedCall(200, () => defender.clearTint());
    if (defStats.hp <= 0) this.killEntity(defender, attacker, defStats, attStats);
}

killEntity(victim, killer, victimStats, killerStats) {
    if (killer) {
        const xpGain = Math.floor(victimStats.xp * 0.75);
        killerStats.xp += xpGain;
        if (killer === this.player) this.gainXP(0);
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
    water.disableBody(true, true);
    const isSuper = water.getData('isSuper');
    const xp = isSuper ? 15 : 5;
    const waterGain = isSuper ? 30 : 10;
    this.gainXP(xp);
    this.playerStats.water = Math.min(this.playerStats.maxWater, this.playerStats.water + waterGain);
    if (isSuper) {
        const txt = this.add.text(player.x, player.y - 50, '+SUPER WATER!', { fontSize: '20px', fill: '#ffd700', stroke: '#000', strokeThickness: 4 }).setDepth(50);
        this.tweens.add({ targets: txt, y: player.y - 100, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
    }
}
eatSun(player, sun) { sun.disableBody(true, true); this.gainXP(8); }
eatSoil(player, soil) { soil.disableBody(true, true); this.gainXP(3); }

botEatResource(bot, res) {
    res.disableBody(true, true);
    const stats = bot.getData('stats');
    stats.xp += 5;
    bot.setData('stats', stats);
}

gainXP(amount) {
    this.playerStats.xp += amount;
    if (this.playerStats.xp >= this.playerStats.nextLevelXP) this.triggerEvolution();
}

triggerEvolution() {
    this.isEvolving = true;
    this.player.setVelocity(0);
    const overlay = this.add.rectangle(0, 0, window.innerWidth, window.innerHeight, 0x000000, 0.9).setScrollFactor(0).setOrigin(0).setDepth(30);
    const title = this.add.text(window.innerWidth / 2, 100, 'EVOLUTION TIME', { fontSize: '48px', fill: '#fff' }).setScrollFactor(0).setOrigin(0.5).setDepth(31);
    if (this.playerStats.form === 'seed') {
        this.createEvoCard(window.innerWidth / 2 - 200, window.innerHeight / 2, 'carnivore', 'EVIL', 'Ability: Dash\nCost: Water', () => this.evolveTo('carnivore', 'evil', overlay, title));
        this.createEvoCard(window.innerWidth / 2 + 200, window.innerHeight / 2, 'tree', 'PEACE', 'Ability: Heal\nCost: Water', () => this.evolveTo('tree', 'peace', overlay, title));
    } else {
        const nextForm = this.playerStats.path === 'evil' ? 'flytrap' : 'ancient_tree';
        const name = this.playerStats.path === 'evil' ? 'Venus Flytrap' : 'Ancient Tree';
        this.createEvoCard(window.innerWidth / 2, window.innerHeight / 2, nextForm, name, 'Ultimate Power', () => this.evolveTo(nextForm, this.playerStats.path, overlay, title));
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

evolveTo(form, path, overlay, title) {
    overlay.destroy();
    title.destroy();
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
    if (isSuper && type === 'water') {
        res.setTint(0xffd700);
        res.setData('isSuper', true);
        res.setScale(0.8);
    }
}

respawnResources() {
    if (this.waters.countActive(true) < 100) this.spawnResource('water');
    if (this.suns.countActive(true) < 100) this.spawnResource('sun');
    if (this.soils.countActive(true) < 100) this.spawnResource('soil');
}
}
