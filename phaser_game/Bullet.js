class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, direction) {
        super(scene, x, y, 'yellow_bullet');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.speed = 400;
        this.direction = direction;
        this.body.allowGravity = false;

        this.setTint(0xffff00);
        this.setDisplaySize(10, 5);

        this.setVelocityX(this.speed * this.direction);
    }

    update() {
        if (this.x < this.scene.cameras.main.scrollX - 100 || this.x > this.scene.cameras.main.scrollX + 900) {
            this.destroy();
        }
    }
}
