import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player_idle_0');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(1.5);
        this.setOrigin(0.5, 1); // Set feet as origin for perfect grounding
        this.setCollideWorldBounds(true);
        this.setGravityY(1200); // Approximate equivalent to Pygame gravity
        this.speed = 300;
        this.jumpsLeft = 1;
        this.extraJumps = 0;
        this.regenLevel = 0;
        this.extraBullets = 0;
        this.shields = 0;
        this.maxShields = 0;
        this.regenTimer = 0;

        // Input
        this.cursors = scene.input.keyboard.addKeys('W,A,S,D');
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
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
            this.scene.sound.play('jump');
            this.anims.play('player_jump', true);
        }

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            // Shoot bullet - Spawn from chest height instead of feet
            const spawnY = this.y - (this.displayHeight * 0.5);
            this.scene.shootBullet(this.x, spawnY, this.flipX ? -1 : 1, true);

            for (let i = 0; i < this.extraBullets; i++) {
                this.scene.shootBullet(this.x, spawnY - (15 * (i + 1)), this.flipX ? -1 : 1, true);
            }
        }

        if (this.body.blocked.down) {
            this.jumpsLeft = this.extraJumps;
        } else if (this.body.velocity.y > 0) {
            // falling optionally could have a fall frame, but jump frame 0 works for now
            this.anims.play('player_jump', true);
        }

        // Regeneration logic
        if (this.regenLevel > 0) {
            this.regenTimer++;
            let threshold = Math.max(60, 300 - (60 * (this.regenLevel - 1)));
            if (this.regenTimer >= threshold) {
                if (this.scene.health < 10) {
                    this.scene.health++;
                    this.scene.updateHealthUI();
                } else if (this.shields < this.maxShields) {
                    this.shields++;
                    this.scene.updateHealthUI();
                }
                this.regenTimer = 0;
            }
        }
    }
}
