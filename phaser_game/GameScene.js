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

        // Load level CSV data (as text, will be parsed later)
        for (let i = 1; i <= 3; i++) {
            this.load.text(`level${i}`, `Assets/level${i}_data.csv`);
        }
    }

    create() {
        // Phase 3: Initialization will go here

        // Add player
        this.player = new Player(this, 100, 100);
    }

    update(time, delta) {
        if (this.player) {
            this.player.update();
        }
    }
}
