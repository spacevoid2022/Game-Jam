import Phaser from 'phaser';
import Player from './Player.js';
import Enemy from './Enemy.js';
import Bullet from './Bullet.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.currentLevel = data.level || 1;
        this.persistedKills = data.kills || 0;
        this.persistedHealth = data.health || 10;
        this.persistedStats = data.playerStats || null;
    }

    preload() {
        // Load images
        this.load.image('sky', 'Assets/img/background/sky_cloud.png');
        this.load.image('mountain', 'Assets/img/background/mountain.png');
        this.load.image('pine1', 'Assets/img/background/pine1.png');
        this.load.image('pine2', 'Assets/img/background/pine2.png');
        this.load.image('player', 'Assets/img/player.png');
        this.load.image('enemy', 'Assets/img/enemy.png');
        this.load.image('bullet', 'Assets/img/bullet.png');
        this.load.image('heart', 'Assets/img/icons/heart.png');

        // Load audio
        this.load.audio('bgMusic', 'Assets/audio/music2.mp3');
        this.load.audio('shot', 'Assets/audio/shot.wav');
        this.load.audio('jump', 'Assets/audio/jump.wav');

        // Load tile images
        for (let i = 0; i <= 20; i++) {
            this.load.image(`tile${i}`, `Assets/img/tile/${i}.png`);
        }

        // Load level CSV data (as text, will be parsed later)
        for (let i = 1; i <= 3; i++) {
            this.load.text(`level${i}`, `Assets/level${i}_data.csv`);
        }

        // Load Player and Enemy animation frames
        const playerAnimCounts = { Idle: 5, Run: 6, Jump: 1, Death: 8 };
        for (const [anim, count] of Object.entries(playerAnimCounts)) {
            for (let i = 0; i < count; i++) {
                this.load.image(`player_${anim.toLowerCase()}_${i}`, `Assets/img/player/${anim}/${i}.png`);
            }
        }

        const enemyAnimCounts = { Idle: 5, Run: 6, Jump: 1, Death: 8 };
        for (const [anim, count] of Object.entries(enemyAnimCounts)) {
            for (let i = 0; i < count; i++) {
                this.load.image(`enemy_${anim.toLowerCase()}_${i}`, `Assets/img/enemy/${anim}/${i}.png`);
            }
        }
    }

    create() {
        // Phase 3: Initialization will go here
        // this.currentLevel is set in init(data)

        // Generate fallback textures
        let bulletGraphics = this.make.graphics({ add: false });
        bulletGraphics.fillStyle(0xffff00);
        bulletGraphics.fillRect(0, 0, 10, 5);
        bulletGraphics.generateTexture('yellow_bullet', 10, 5);

        let heartGraphics = this.make.graphics({ add: false });
        heartGraphics.fillStyle(0xff0000);
        heartGraphics.fillRect(0, 0, 30, 30);
        heartGraphics.generateTexture('red_square', 30, 30);

        // Start background music
        if (!this.sound.get('bgMusic')) {
            this.bgMusic = this.sound.add('bgMusic', { loop: true, volume: 0.3 });
            this.bgMusic.play();
        } else if (!this.sound.get('bgMusic').isPlaying) {
            this.sound.play('bgMusic');
        }

        // Game States
        this.GAME_STATES = {
            MENU: 0, PLAYING: 1, GAME_OVER: 2,
            PAUSED: 3, STORE: 4, LEVEL_COMPLETE: 5, GAME_BEATEN: 6
        };
        this.currentState = this.GAME_STATES.PLAYING; // Skip menu for now for easy testing

        // Backgrounds
        this.createBackgrounds();

        this.obstacles = this.physics.add.staticGroup();
        this.decorations = this.add.group();
        this.enemies = this.physics.add.group();
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();

        this.createUI();
        this.createAnimations();
        this.playerSpawn = { x: 100, y: 100 };
        this.generateLevel();

        // Add player
        this.player = new Player(this, this.playerSpawn.x, this.playerSpawn.y);
        this.player.setDepth(11);

        // Apply persisted stats
        if (this.persistedStats) {
            this.player.extraJumps = this.persistedStats.extraJumps || 0;
            this.player.regenLevel = this.persistedStats.regenLevel || 0;
            this.player.extraBullets = this.persistedStats.extraBullets || 0;
            this.player.maxShields = this.persistedStats.maxShields || 0;
            this.player.shields = this.persistedStats.shields || 0;
        }

        // Add collision
        this.physics.add.collider(this.player, this.obstacles);
        this.physics.add.collider(this.enemies, this.obstacles);

        this.physics.add.collider(this.playerBullets, this.obstacles, (bullet) => bullet.destroy());
        this.physics.add.collider(this.enemyBullets, this.obstacles, (bullet) => bullet.destroy());
        this.physics.add.overlap(this.playerBullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.enemyBullets, this.player, this.hitPlayer, null, this);

        // Camera
        this.cameras.main.setBounds(0, 0, 150 * 40, 640); // 150 tiles * 40px
        this.physics.world.setBounds(0, -500, 150 * 40, 2000); // Height to 2000 to allow falling past 640
        this.cameras.main.startFollow(this.player);

        // Store Keys
        this.tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
        this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.nKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
        this.keys = this.input.keyboard.addKeys('ONE,TWO,THREE,FOUR');

        this.createTouchControls();

        this.updateHealthUI();
    }

    createTouchControls() {
        // Only show if it's potentially a touch device
        // if (!this.sys.game.device.input.touch) return; 

        const width = 800;
        const height = 640;

        // Left Button
        this.leftBtn = this.add.circle(60, height - 60, 40, 0x333333, 0.5)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(1000);
        this.add.text(60, height - 60, '<', { fontSize: '40px', fill: '#fff' })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1001);

        // Right Button
        this.rightBtn = this.add.circle(160, height - 60, 40, 0x333333, 0.5)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(1000);
        this.add.text(160, height - 60, '>', { fontSize: '40px', fill: '#fff' })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1001);

        // Jump Button
        this.jumpBtn = this.add.circle(width - 160, height - 60, 40, 0x333333, 0.5)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(1000);
        this.add.text(width - 160, height - 60, 'J', { fontSize: '40px', fill: '#fff' })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1001);

        // Shoot Button
        this.shootBtn = this.add.circle(width - 60, height - 60, 40, 0x333333, 0.5)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(1000);
        this.add.text(width - 60, height - 60, 'S', { fontSize: '40px', fill: '#fff' })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1001);

        // Shop Toggle Button (Top Right)
        this.shopBtn = this.add.rectangle(width - 60, 40, 80, 40, 0x333333, 0.5)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(1000);
        this.add.text(width - 60, 40, 'SHOP', { fontSize: '20px', fill: '#fff' })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1001);

        // Track states
        this.touchControls = {
            left: false,
            right: false,
            jump: false,
            shoot: false
        };

        this.leftBtn.on('pointerdown', () => this.touchControls.left = true);
        this.leftBtn.on('pointerup', () => this.touchControls.left = false);
        this.leftBtn.on('pointerout', () => this.touchControls.left = false);

        this.rightBtn.on('pointerdown', () => this.touchControls.right = true);
        this.rightBtn.on('pointerup', () => this.touchControls.right = false);
        this.rightBtn.on('pointerout', () => this.touchControls.right = false);

        this.jumpBtn.on('pointerdown', () => this.touchControls.jump = true);
        this.jumpBtn.on('pointerup', () => this.touchControls.jump = false);
        this.jumpBtn.on('pointerout', () => this.touchControls.jump = false);

        this.shootBtn.on('pointerdown', () => this.touchControls.shoot = true);
        this.shootBtn.on('pointerup', () => this.touchControls.shoot = false);
        this.shootBtn.on('pointerout', () => this.touchControls.shoot = false);

        this.shopBtn.on('pointerdown', () => {
            if (this.currentState === this.GAME_STATES.PLAYING) {
                this.currentState = this.GAME_STATES.STORE;
                this.storeUI.setVisible(true);
                this.physics.world.pause();
                this.updateStoreTexts();
            } else if (this.currentState === this.GAME_STATES.STORE) {
                this.currentState = this.GAME_STATES.PLAYING;
                this.storeUI.setVisible(false);
                this.physics.world.resume();
            }
        });
    }

    createUI() {
        this.kills = this.persistedKills;
        this.maxHealth = 10;
        this.health = this.persistedHealth;
        this.enemySpawnPoints = []; // Track static enemy spawns

        this.scoreText = this.add.text(10, 10, 'Kills: ' + this.kills, { fontSize: '30px', fill: '#FFF' }).setScrollFactor(0);
        this.scoreText.setStroke('#000000', 4);

        this.hearts = [];
        for (let i = 0; i < this.maxHealth; i++) {
            let heart = this.add.image(25 + (i * 35), 60, 'red_square').setScrollFactor(0);
            this.hearts.push(heart);
        }

        this.shieldsUI = [];
        for (let i = 0; i < 10; i++) {
            let shield = this.add.rectangle(25 + (i * 35), 100, 25, 25, 0x0064ff).setScrollFactor(0);
            shield.setVisible(false);
            shield.setDepth(100);
            this.shieldsUI.push(shield);
        }

        this.createGameOverUI();
        this.createStoreUI();
    }

    updateHealthUI() {
        if (!this.hearts) return; // safety check
        for (let i = 0; i < this.maxHealth; i++) {
            if (this.hearts[i]) this.hearts[i].setVisible(i < this.health);
        }
        for (let i = 0; i < 10; i++) {
            if (this.shieldsUI[i]) this.shieldsUI[i].setVisible(i < this.player.shields);
        }
    }

    shootBullet(x, y, direction, isPlayer) {
        if (isPlayer) this.sound.play('shot');
        let bullet = new Bullet(this, x, y, direction);
        if (isPlayer) {
            this.playerBullets.add(bullet);
        } else {
            this.enemyBullets.add(bullet);
        }
        // Force velocity after group addition to avoid reset
        bullet.setVelocityX(bullet.speed * bullet.direction);
    }

    hitEnemy(bullet, enemy) {
        if (!enemy.isAlive) return;
        bullet.destroy();
        enemy.health--;
        if (enemy.health <= 0) {
            enemy.die();
            this.kills++;
            this.scoreText.setText('Kills: ' + this.kills);
            this.sound.play('shot'); // Enemy death sound fallback
        }
    }

    hitPlayer(player, bullet) {
        if (bullet) bullet.destroy();

        if (this.player.shields > 0) {
            this.player.shields--;
        } else {
            this.health--;
        }

        this.updateHealthUI();
        this.sound.play('shot'); // Hit damage sound

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.health = 0;
        this.updateHealthUI();
        this.currentState = this.GAME_STATES.GAME_OVER;
        this.finalKillsText.setText('Final Kills: ' + this.kills);
        this.gameOverUI.setVisible(true);
    }

    resetGame() {
        this.kills = 0;
        this.scoreText.setText('Kills: 0');
        this.health = 10;

        // Reset player properties
        if (this.player) {
            this.player.shields = 0;
            this.player.maxShields = 0;
            this.player.extraJumps = 0;
            this.player.regenLevel = 0;
            this.player.extraBullets = 0;
            this.player.regenTimer = 0;
            this.player.setPosition(100, 100);
            this.player.setVelocity(0, 0);
        }

        // Clear and Re-spawn enemies
        this.enemies.clear(true, true);
        this.reSpawnStaticEnemies();

        this.updateHealthUI();
        this.gameOverUI.setVisible(false);
        this.scene.restart({ level: 1, kills: 0, health: 10, playerStats: null });
    }

    reSpawnStaticEnemies() {
        this.enemySpawnPoints.forEach(pt => {
            let enemy = new Enemy(this, pt.x, pt.y);
            this.enemies.add(enemy);
        });
    }

    createAnimations() {
        // Player Anims
        this.anims.create({ key: 'player_idle', frames: Array.from({ length: 5 }, (_, i) => ({ key: `player_idle_${i}` })), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'player_run', frames: Array.from({ length: 6 }, (_, i) => ({ key: `player_run_${i}` })), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'player_jump', frames: Array.from({ length: 1 }, (_, i) => ({ key: `player_jump_${i}` })), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'player_death', frames: Array.from({ length: 8 }, (_, i) => ({ key: `player_death_${i}` })), frameRate: 10, repeat: 0 });

        // Enemy Anims
        this.anims.create({ key: 'enemy_idle', frames: Array.from({ length: 5 }, (_, i) => ({ key: `enemy_idle_${i}` })), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'enemy_run', frames: Array.from({ length: 6 }, (_, i) => ({ key: `enemy_run_${i}` })), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'enemy_jump', frames: Array.from({ length: 1 }, (_, i) => ({ key: `enemy_jump_${i}` })), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'enemy_death', frames: Array.from({ length: 8 }, (_, i) => ({ key: `enemy_death_${i}` })), frameRate: 10, repeat: 0 });
    }

    createBackgrounds() {
        // Using TileSprites for parallax scrolling
        const width = 800; // Screen width
        const height = 640;
        this.skyBg = this.add.tileSprite(0, 0, width, height, 'sky').setOrigin(0, 0).setScrollFactor(0);
        this.mountainBg = this.add.tileSprite(0, height - 300, width, 300, 'mountain').setOrigin(0, 0).setScrollFactor(0);
        this.pine1Bg = this.add.tileSprite(0, height - 150, width, 150, 'pine1').setOrigin(0, 0).setScrollFactor(0);
        this.pine2Bg = this.add.tileSprite(0, height - 80, width, 80, 'pine2').setOrigin(0, 0).setScrollFactor(0); // Adjust height accordingly
    }

    generateLevel() {
        const csvData = this.cache.text.get(`level${this.currentLevel}`);
        const rows = csvData.split('\n').map(row => row.split(',').map(tile => parseInt(tile.trim())));

        const TILE_SIZE = 40;

        rows.forEach((row, y) => {
            row.forEach((tileId, x) => {
                const px = x * TILE_SIZE + (TILE_SIZE / 2);
                const py = y * TILE_SIZE + (TILE_SIZE / 2);

                if (tileId >= 0 && tileId <= 8) {
                    // Solid obstacles
                    let img = this.obstacles.create(px, py, `tile${tileId}`);
                    img.setDisplaySize(TILE_SIZE, TILE_SIZE);
                    img.refreshBody();
                    img.setDepth(5);
                } else if (tileId >= 11 && tileId <= 14) {
                    // Decorations (no collision). Exclude 15+ (Spawns and Items)
                    let img = this.decorations.create(px, py, `tile${tileId}`);
                    img.setDisplaySize(TILE_SIZE, TILE_SIZE);
                    img.setDepth(2); // Crates behind characters
                } else if (tileId === 16) {
                    // Enemy spawn - Search DOWN for solid ground
                    let spawnY = (y + 1) * 40;
                    for (let rowIdx = y + 1; rowIdx < rows.length; rowIdx++) {
                        const belowTileId = rows[rowIdx][x];
                        if (belowTileId >= 0 && belowTileId <= 8) {
                            spawnY = rowIdx * 40; // Top of the solid tile
                            break;
                        }
                    }
                    this.enemySpawnPoints.push({ x: px, y: spawnY - 2 }); // Spawn 2px above ground
                    let enemy = new Enemy(this, px, spawnY - 2);
                    enemy.setDepth(10);
                    this.enemies.add(enemy);
                } else if (tileId === 15) {
                    // Player spawn - Search DOWN for solid ground
                    let spawnY = py;
                    for (let rowIdx = y + 1; rowIdx < rows.length; rowIdx++) {
                        const belowTileId = rows[rowIdx][x];
                        if (belowTileId >= 0 && belowTileId <= 8) {
                            spawnY = rowIdx * 40; // Top of the solid tile
                            break;
                        }
                    }
                    this.playerSpawn = { x: px, y: spawnY - 2 }; // Spawn 2px above ground
                }
            });
        });
    }

    update(time, delta) {
        if (Phaser.Input.Keyboard.JustDown(this.tabKey)) {
            if (this.currentState === this.GAME_STATES.PLAYING) {
                this.currentState = this.GAME_STATES.STORE;
                this.storeUI.setVisible(true);
                this.physics.world.pause(); // Pause AI and movement
                this.updateStoreTexts();
            } else if (this.currentState === this.GAME_STATES.STORE) {
                this.currentState = this.GAME_STATES.PLAYING;
                this.storeUI.setVisible(false);
                this.physics.world.resume(); // Resume game
            }
        }

        if (this.currentState === this.GAME_STATES.STORE) {
            // Check for 1, 2, 3, 4 inputs for purchases
            if (Phaser.Input.Keyboard.JustDown(this.keys.ONE) && this.kills >= 5) {
                this.kills -= 5;
                this.player.extraJumps++;
                this.scoreText.setText('Kills: ' + this.kills);
                this.updateStoreTexts(); // Refresh UI feedback
            }
            if (Phaser.Input.Keyboard.JustDown(this.keys.TWO) && this.kills >= 10) {
                this.kills -= 10;
                this.player.regenLevel++;
                this.scoreText.setText('Kills: ' + this.kills);
                this.updateStoreTexts();
            }
            if (Phaser.Input.Keyboard.JustDown(this.keys.THREE) && this.kills >= 15) {
                this.kills -= 15;
                this.player.extraBullets++;
                this.scoreText.setText('Kills: ' + this.kills);
                this.updateStoreTexts();
            }
            if (Phaser.Input.Keyboard.JustDown(this.keys.FOUR) && this.kills >= 20) {
                this.kills -= 20;
                this.player.maxShields++;
                this.player.shields++;
                this.updateHealthUI();
                this.scoreText.setText('Kills: ' + this.kills);
                this.updateStoreTexts();
            }
        }

        if (this.currentState === this.GAME_STATES.STORE || this.currentState === this.GAME_STATES.PLAYING || this.currentState === this.GAME_STATES.GAME_OVER) {
            if (Phaser.Input.Keyboard.JustDown(this.qKey)) {
                this.die();
            }
            if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
                this.resetGame();
            }
        }

        if (this.currentState === this.GAME_STATES.LEVEL_COMPLETE) {
            if (Phaser.Input.Keyboard.JustDown(this.nKey)) {
                if (this.currentLevel < 3) {
                    this.scene.restart({
                        level: this.currentLevel + 1,
                        kills: this.kills,
                        health: this.health,
                        playerStats: {
                            extraJumps: this.player.extraJumps,
                            regenLevel: this.player.regenLevel,
                            extraBullets: this.player.extraBullets,
                            maxShields: this.player.maxShields,
                            shields: this.player.shields
                        }
                    });
                } else {
                    this.currentState = this.GAME_STATES.GAME_BEATEN;
                }
            }
        }

        if (this.currentState === this.GAME_STATES.PLAYING) {
            // Level completion check (150 tiles * 40px = 6000px)
            if (this.player.x > (150 * 40) - 150) {
                this.currentState = this.GAME_STATES.LEVEL_COMPLETE;
                this.add.text(400, 320, 'LEVEL COMPLETE!\nPress N for Next Level', { fontSize: '48px', fill: '#ffff00', align: 'center' }).setOrigin(0.5).setScrollFactor(0);
            }

            // Death by falling
            if (this.player.y > 640) {
                this.die();
            }

            // Dynamic Spawning
            this.spawnTimer = (this.spawnTimer || 0) + 1;
            if (!this.nextSpawnTime) this.nextSpawnTime = Phaser.Math.Between(60, 180);

            if (this.spawnTimer >= this.nextSpawnTime) {
                this.spawnTimer = 0;
                this.nextSpawnTime = Phaser.Math.Between(60, 180);

                let spawnX = this.cameras.main.scrollX + Phaser.Math.Between(850, 1100);
                // Ensure they spawn high enough to fall onto a platform
                let spawnY = Phaser.Math.Between(-200, 0);

                let count = Phaser.Math.Between(1, 3); // Spawn up to 3 at once
                for (let i = 0; i < count; i++) {
                    let offset = i * 40;
                    let newEnemy = new Enemy(this, spawnX + offset, spawnY);
                    this.enemies.add(newEnemy);
                }
            }

            if (this.player) {
                this.player.update();
            }
            if (this.enemies) {
                this.enemies.getChildren().forEach(enemy => {
                    enemy.update();
                    if (enemy.y > 700) enemy.destroy(); // Destroy enemies that fall off
                });
            }
            if (this.playerBullets) {
                this.playerBullets.getChildren().forEach(bullet => bullet.update());
            }
            if (this.enemyBullets) {
                this.enemyBullets.getChildren().forEach(bullet => bullet.update());
            }

            // Parallax scroll updates
            const camX = this.cameras.main.scrollX;
            this.skyBg.tilePositionX = camX * 0.5;
            this.mountainBg.tilePositionX = camX * 0.6;
            this.pine1Bg.tilePositionX = camX * 0.7;
            this.pine2Bg.tilePositionX = camX * 0.8;
        }
    }

    createGameOverUI() {
        this.gameOverUI = this.add.container(400, 320).setScrollFactor(0).setVisible(false);
        let bg = this.add.rectangle(0, 0, 800, 640, 0x000000, 0.8);
        this.gameOverText = this.add.text(0, -60, 'GAME OVER', { fontSize: '64px', fill: '#ff0000' }).setOrigin(0.5);
        this.finalKillsText = this.add.text(0, 5, 'Final Kills: 0', { fontSize: '30px', fill: '#ffffff' }).setOrigin(0.5);
        let sub = this.add.text(0, 65, 'Press R to Respawn', { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5);
        this.gameOverUI.add([bg, this.gameOverText, this.finalKillsText, sub]);
        this.gameOverUI.setDepth(200);
    }

    createStoreUI() {
        this.storeUI = this.add.container(400, 300).setScrollFactor(0).setVisible(false);
        let bg = this.add.rectangle(0, 0, 800, 600, 0x000000, 0.85); // Full screen overlay
        let frame = this.add.rectangle(0, 0, 500, 400, 0x333333, 1).setStrokeStyle(4, 0xffff00);

        let title = this.add.text(0, -150, 'UPGRADE SHOP (PAUSED)', { fontSize: '32px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5);

        this.storeItems = {
            extraJumps: this.add.text(0, -80, '1. Extra Jump (5 Kills) - Lv: 0', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5),
            regenLevel: this.add.text(0, -30, '2. Health Regen (10 Kills) - Lv: 0', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5),
            extraBullets: this.add.text(0, 20, '3. Extra Bullets (15 Kills) - Lv: 0', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5),
            maxShields: this.add.text(0, 70, '4. Max Shields (20 Kills) - Lv: 0', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5)
        };

        let hint = this.add.text(0, 140, 'Press [1-4] to Purchase', { fontSize: '20px', fill: '#ffff00' }).setOrigin(0.5);
        let footer = this.add.text(0, 175, 'Press TAB to Resume Game', { fontSize: '18px', fill: '#aaa' }).setOrigin(0.5);

        this.storeUI.add([bg, frame, title, this.storeItems.extraJumps, this.storeItems.regenLevel, this.storeItems.extraBullets, this.storeItems.maxShields, hint, footer]);
        this.storeUI.setDepth(100);
    }

    updateStoreTexts() {
        if (!this.storeItems) return;
        this.storeItems.extraJumps.setText(`1. Extra Jump (5 Kills) - Lv: ${this.player.extraJumps}`);
        this.storeItems.regenLevel.setText(`2. Health Regen (10 Kills) - Lv: ${this.player.regenLevel}`);
        this.storeItems.extraBullets.setText(`3. Extra Bullets (15 Kills) - Lv: ${this.player.extraBullets}`);
        this.storeItems.maxShields.setText(`4. Max Shields (20 Kills) - Lv: ${this.player.maxShields}`);

        // Visual feedback for affordability
        const items = [
            { txt: this.storeItems.extraJumps, cost: 5 },
            { txt: this.storeItems.regenLevel, cost: 10 },
            { txt: this.storeItems.extraBullets, cost: 15 },
            { txt: this.storeItems.maxShields, cost: 20 }
        ];

        items.forEach(item => {
            item.txt.setFill(this.kills >= item.cost ? '#00ff00' : '#ff4444');
        });
    }
}
