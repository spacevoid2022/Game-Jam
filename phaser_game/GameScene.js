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
    }

    create() {
        // Phase 3: Initialization will go here
        this.currentLevel = 1;

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

        this.generateLevel();

        // Add player
        // Spawn coordinates will eventually come from the CSV (tile 15)
        this.player = new Player(this, 100, 100);

        // Add collision
        this.physics.add.collider(this.player, this.obstacles);

        // Camera
        this.cameras.main.setBounds(0, 0, 150 * 40, 640); // 150 tiles * 40px
        this.physics.world.setBounds(0, 0, 150 * 40, 640);
        this.cameras.main.startFollow(this.player);
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
                    }
                }
            });
        });
    }

    update(time, delta) {
        if (this.currentState === this.GAME_STATES.PLAYING) {
            if (this.player) {
                this.player.update();
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
