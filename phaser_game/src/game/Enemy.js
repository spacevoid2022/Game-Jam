import Phaser from 'phaser';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy_idle_0');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(1.5);
        this.setOrigin(0.5, 1); // Stand on floor at Y coordinate

        this.setGravityY(1200);

        this.health = scene.currentLevel || 1;
        this.setDepth(10); // Standard enemy depth
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

        // Calculate vision rect (Higher up near 'eyes' area, starting from edge)
        let visionRect;
        let visionY = this.y - (this.displayHeight * 0.8);
        let halfWidth = this.displayWidth / 2;
        if (this.direction === 1) {
            visionRect = new Phaser.Geom.Rectangle(this.x + halfWidth, visionY, visionWidth, visionHeight);
        } else {
            visionRect = new Phaser.Geom.Rectangle(this.x - halfWidth - visionWidth, visionY, visionWidth, visionHeight);
        }

        // Check if player in vision
        const playerRect = new Phaser.Geom.Rectangle(player.x - (player.displayWidth / 2), player.y - player.displayHeight, player.displayWidth, player.displayHeight);

        if (Phaser.Geom.Intersects.RectangleToRectangle(visionRect, playerRect) && player.y < 640) { // check if player is "alive" approx
            this.idling = true;
            this.idlingCounter = 20;

            if (this.shootCooldown === 0) {
                this.shootCooldown = 240;
                this.scene.shootBullet(this.x + (halfWidth * this.direction), this.y - (this.displayHeight * 0.5), this.direction, false);
            }
        }

        if (!this.idling) {
            this.setVelocityX(this.speed * this.direction);
            this.moveCounter++;

            // Increased moveCounter limit for longer patrols
            if (this.moveCounter > Phaser.Math.Between(120, 250)) {
                this.direction *= -1;
                this.moveCounter = 0;
                this.idling = true;
                this.idlingCounter = Phaser.Math.Between(40, 100);
            }
        } else {
            this.setVelocityX(0);
            this.idlingCounter--;
            if (this.idlingCounter <= 0) {
                this.idling = false;
            }
        }

        // Ledge detection (only when on ground)
        if (this.body.blocked.down && this.body.velocity.x !== 0) {
            // Predict the ledge further ahead using a check rectangle
            const checkWidth = 30;
            const checkHeight = 40;
            const checkX = this.direction === 1 ? this.x + 20 : this.x - 20 - checkWidth;
            const checkY = this.y + 2; // Check just below the feet level

            let hasGround = false;
            const obstacles = scene.obstacles.getChildren();
            const checkRect = new Phaser.Geom.Rectangle(checkX, checkY, checkWidth, checkHeight);

            for (let i = 0; i < obstacles.length; i++) {
                const tile = obstacles[i];
                if (Phaser.Geom.Intersects.RectangleToRectangle(checkRect, tile.getBounds())) {
                    hasGround = true;
                    break;
                }
            }

            if (!hasGround) {
                this.direction *= -1;
                this.moveCounter = 0;
                this.setVelocityX(0);
                // Snap back to safety to prevent any "hanging" frames
                this.x += (this.direction * 10);
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
        if (this.idling) {
            this.anims.play('enemy_idle', true);
        } else {
            this.anims.play('enemy_run', true);
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
