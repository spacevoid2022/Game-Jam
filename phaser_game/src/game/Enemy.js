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

        // Ledge detection (only when on ground)
        if (this.body.blocked.down && this.body.velocity.x !== 0) {
            // Check slightly further ahead to ensure we don't float
            const checkDistance = 20;
            const ledgeCheckX = this.direction === 1 ? this.x + checkDistance : this.x - checkDistance;
            const ledgeCheckY = this.y + 5; // Direct check below feet

            let hasGround = false;
            const obstacles = scene.obstacles.getChildren();
            for (let i = 0; i < obstacles.length; i++) {
                const tile = obstacles[i];
                // Use built-in Phaser collision check or simple bounds overlap
                if (tile.getBounds().contains(ledgeCheckX, ledgeCheckY)) {
                    hasGround = true;
                    break;
                }
            }

            if (!hasGround) {
                this.direction *= -1;
                this.moveCounter = 0;
                this.setVelocityX(0);
                // Snap slightly back to safety
                this.x -= (this.direction * 5);
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
