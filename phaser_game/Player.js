class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setGravityY(1200); // Approximate equivalent to Pygame gravity
        this.speed = 300;
        this.jumpsLeft = 1;
        this.extraJumps = 0;

        // Input
        this.cursors = scene.input.keyboard.addKeys('W,A,S,D');
    }

    update() {
        if (this.cursors.A.isDown) {
            this.setVelocityX(-this.speed);
            this.setFlipX(true);
        } else if (this.cursors.D.isDown) {
            this.setVelocityX(this.speed);
            this.setFlipX(false);
        } else {
            this.setVelocityX(0);
        }

        const isJustDown = Phaser.Input.Keyboard.JustDown(this.cursors.W);
        if (isJustDown && (this.body.blocked.down || this.jumpsLeft > 0)) {
            if (!this.body.blocked.down) {
                this.jumpsLeft--;
            }
            this.setVelocityY(-600);
        }

        if (this.body.blocked.down) {
            this.jumpsLeft = this.extraJumps;
        }
    }
}
