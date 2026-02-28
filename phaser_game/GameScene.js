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
        this.obstacles = this.physics.add.staticGroup();
        this.decorations = this.add.group();

        this.generateLevel();

        // Add player
        // Spawn coordinates will eventually come from the CSV (tile 15)
        this.player = new Player(this, 100, 100);

        // Add collision
        this.physics.add.collider(this.player, this.obstacles);
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
        if (this.player) {
            this.player.update();
        }
    }
}
