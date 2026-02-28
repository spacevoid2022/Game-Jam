class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, direction) {
        // We can just use a generic texture or a generated shape. 
        // Pygame code did: self.image = pygame.Surface((10, 5)); self.image.fill((255, 255, 0))
        // So let's just use the 'bullet' texture if it exists, or generate a rectangle.
        super(scene, x, y, 'bullet');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // If image 'bullet' wasn't loaded correctly, we could do:
        // this.setTexture('__WHITE');
        // this.setTint(0xffff00);
        // this.setDisplaySize(10, 5);

        this.body.allowGravity = false;
        this.speed = 400;
        this.direction = direction;

        this.setVelocityX(this.speed * this.direction);
    }

    update() {
        // Destroy if out of camera bounds roughly
        if (this.x < this.scene.cameras.main.scrollX || this.x > this.scene.cameras.main.scrollX + 800) {
            this.destroy();
        }
    }
}
