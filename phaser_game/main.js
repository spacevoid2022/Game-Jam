const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 640,
    backgroundColor: '#90c978',
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // Will set to 0.75 in Phase 3
            debug: false
        }
    },
    scene: [GameScene]
};

const game = new Phaser.Game(config);
