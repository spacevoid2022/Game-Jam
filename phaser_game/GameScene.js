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
    // Phase 3: Asset loading will go here
}

create() {
    // Phase 3: Initialization will go here

    // Temporary text to show the scene is running
    this.add.text(400, 320, 'Phaser 3 Base Project Initialized', {
        font: '32px Arial',
        fill: '#ffffff'
    }).setOrigin(0.5);
}

update(time, delta) {
    // Phase 3: Game loop logic will go here
}
}
