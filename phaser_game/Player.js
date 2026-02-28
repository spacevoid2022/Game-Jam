class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player_idle_0');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setGravityY(1200); // Approximate equivalent to Pygame gravity
        this.speed = 300;
        this.jumpsLeft = 1;
        this.extraJumps = 0;

        // Input
        this.cursors = scene.input.keyboard.addKeys('W,A,S,D');
        this.anims.play('player_idle', true);
    }

    update() {
        if (this.cursors.A.isDown) {
            this.setVelocityX(-this.speed);
            this.setFlipX(true);
            if (this.body.blocked.down) this.anims.play('player_run', true);
        } else if (this.cursors.D.isDown) {
            this.setVelocityX(this.speed);
            this.setFlipX(false);
            if (this.body.blocked.down) this.anims.play('player_run', true);
        } else {
            this.setVelocityX(0);
            if (this.body.blocked.down) this.anims.play('player_idle', true);
        }

        const isJustDown = Phaser.Input.Keyboard.JustDown(this.cursors.W);
        if (isJustDown && (this.body.blocked.down || this.jumpsLeft > 0)) {
            if (!this.body.blocked.down) {
                this.jumpsLeft--;
            }
            this.setVelocityY(-600);
            this.anims.play('player_jump', true);
        }

        if (this.body.blocked.down) {
            this.jumpsLeft = this.extraJumps;
        } else if (this.body.velocity.y > 0) {
            // falling optionally could have a fall frame, but jump frame 0 works for now
            this.anims.play('player_jump', true);
        }
    }
}
