class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_idle_0');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setGravityY(1200);

        this.health = 1;
        this.speed = 80;
        this.direction = 1;

        this.shootCooldown = 0;
        this.isAlive = true;

        this.moveCounter = 0;
        this.idling = false;
        this.idlingCounter = 0;

        this.anims.play('enemy_idle', true);
    }

    update() {
        if (!this.isAlive) {
            this.setVelocityX(0);
            return;
        }

        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        this.move();
    }

    move() {
        const scene = this.scene;
        const player = scene.player;

        // Vision Check
        const visionWidth = 150;
        const visionHeight = 20;

        // Calculate vision rect
        let visionRect;
        if (this.direction === 1) {
            visionRect = new Phaser.Geom.Rectangle(this.x + (this.width / 2), this.y - (visionHeight / 2), visionWidth, visionHeight);
        } else {
            visionRect = new Phaser.Geom.Rectangle(this.x - (this.width / 2) - visionWidth, this.y - (visionHeight / 2), visionWidth, visionHeight);
        }

        // Check if player in vision
        const playerRect = new Phaser.Geom.Rectangle(player.x - (player.width / 2), player.y - (player.height / 2), player.width, player.height);

        if (Phaser.Geom.Intersects.RectangleToRectangle(visionRect, playerRect) && player.body.y < 640) { // check if player is "alive" approx
            this.idling = true;
            this.idlingCounter = 20;

            if (this.shootCooldown === 0) {
                this.shootCooldown = 240;
                this.scene.shootBullet(this.x, this.y, this.direction, false);
            }
        }

        if (!this.idling) {
            this.setVelocityX(this.speed * this.direction);
            this.moveCounter++;

            if (this.moveCounter > 40) { // TILE_SIZE
                this.direction *= -1;
                this.moveCounter *= -1;
                this.idling = true;
                this.idlingCounter = Phaser.Math.Between(30, 90);
            }
        } else {
            this.setVelocityX(0);
            this.idlingCounter--;
            if (this.idlingCounter <= 0) {
                this.idling = false;
            }
        }

        // Ledge detection (when on ground)
        if (this.body.blocked.down && this.body.velocity.x !== 0) {
            const ledgeCheckX = this.direction === 1 ? this.body.right + 20 : this.body.left - 20;
            const ledgeCheckY = this.body.bottom + 5;

            // Simple raycast to check if there is a tile below the next step
            const tile = scene.obstacles.getChildren().find(t =>
                t.body.hitTest(ledgeCheckX, ledgeCheckY)
            );

            if (!tile) {
                this.direction *= -1;
                this.moveCounter = 0;
                this.setVelocityX(0); // Stop horizontal movement to prevent falling
            }
        }

        // Wall collision
        if (this.body.blocked.right && this.direction === 1) {
            this.direction = -1;
            this.moveCounter = 0;
        } else if (this.body.blocked.left && this.direction === -1) {
            this.direction = 1;
            this.moveCounter = 0;
        }

        // Flip image
        this.setFlipX(this.direction === -1);

        // Animation update
        if (this.body.velocity.x !== 0) {
            this.anims.play('enemy_run', true);
        } else {
            this.anims.play('enemy_idle', true);
        }
    }

    die() {
        this.isAlive = false;
        this.anims.play('enemy_death', true);
        this.on('animationcomplete', () => {
            if (this.anims.currentAnim.key === 'enemy_death') {
                this.destroy();
            }
        });
    }
}
