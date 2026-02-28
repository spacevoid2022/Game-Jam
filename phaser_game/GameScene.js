class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
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
        this.currentLevel = 1;

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
        this.generateLevel();

        // Add player
        // Spawn coordinates will eventually come from the CSV (tile 15)
        this.player = new Player(this, 100, 100);

        // Add collision
        this.physics.add.collider(this.player, this.obstacles);
        this.physics.add.collider(this.enemies, this.obstacles);

        this.physics.add.collider(this.playerBullets, this.obstacles, (bullet) => bullet.destroy());
        this.physics.add.collider(this.enemyBullets, this.obstacles, (bullet) => bullet.destroy());
        this.physics.add.overlap(this.playerBullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.enemyBullets, this.player, this.hitPlayer, null, this);

        // Camera
        this.cameras.main.setBounds(0, 0, 150 * 40, 640); // 150 tiles * 40px
        this.physics.world.setBounds(0, 0, 150 * 40, 640);
        this.cameras.main.startFollow(this.player);
    }

    createUI() {
        this.kills = 0;
        this.maxHealth = 10;
        this.health = 10;

        this.scoreText = this.add.text(10, 10, 'Kills: 0', { fontSize: '30px', fill: '#FFF' }).setScrollFactor(0);
        this.scoreText.setStroke('#000000', 4);

        this.hearts = [];
        for (let i = 0; i < this.maxHealth; i++) {
            let heart = this.add.image(25 + (i * 35), 60, 'red_square').setScrollFactor(0);
            this.hearts.push(heart);
        }
    }

    updateHealthUI() {
        for (let i = 0; i < this.maxHealth; i++) {
            this.hearts[i].setVisible(i < this.health);
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
        bullet.destroy();
        this.health--;
        this.updateHealthUI();
        this.sound.play('shot'); // Hit damage sound

        if (this.health <= 0) {
            this.currentState = this.GAME_STATES.GAME_OVER;
            // Immediate respawn logic to prevent blocking
            setTimeout(() => {
                this.health = 10;
                this.updateHealthUI();
                this.player.setPosition(100, 100);
                this.currentState = this.GAME_STATES.PLAYING;
            }, 1000);
        }
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
        const rows = csvData.split('\n');

        const TILE_SIZE = 40;

        rows.forEach((row, y) => {
            const tiles = row.split(',');
            tiles.forEach((tile, x) => {
                const tileId = parseInt(tile.trim());
                if (tileId >= 0) {
                    const px = x * TILE_SIZE + (TILE_SIZE / 2);
                    const py = y * TILE_SIZE + (TILE_SIZE / 2);

                    if (tileId >= 0 && tileId <= 8) {
                        let img = this.obstacles.create(px, py, `tile${tileId}`);
                        img.setDisplaySize(TILE_SIZE, TILE_SIZE);
                        img.refreshBody();
                    } else if (tileId >= 11 && tileId <= 14) {
                        let img = this.decorations.create(px, py, `tile${tileId}`);
                        img.setDisplaySize(TILE_SIZE, TILE_SIZE);
                    } else if (tileId === 15) {
                        // Will handle player spawn in next updates
                    } else if (tileId === 16) {
                        // Enemy spawn
                        let enemy = new Enemy(this, px, py - 20); // offset y slightly above tile
                        this.enemies.add(enemy);
                    }
                }
            });
        });
    }

    update(time, delta) {
        if (this.currentState === this.GAME_STATES.PLAYING) {
            // Dynamic Spawning
            this.spawnTimer = (this.spawnTimer || 0) + 1;
            if (this.spawnTimer >= 360) {
                this.spawnTimer = 0;
                let spawnX = this.cameras.main.scrollX + Phaser.Math.Between(850, 1000);
                let newEnemy = new Enemy(this, spawnX, -50);
                this.enemies.add(newEnemy);
            }

            if (this.player) {
                this.player.update();
            }
            if (this.enemies) {
                this.enemies.getChildren().forEach(enemy => enemy.update());
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
}
