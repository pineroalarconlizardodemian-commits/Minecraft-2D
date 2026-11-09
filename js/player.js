class Player {
    constructor(world) {
        this.world = world;
        this.x = 0;
        this.y = 0;
        this.w = 0.6;   // ancho en bloques
        this.h = 1.8;   // alto en bloques
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.speed = 6;         // bloques/seg
        this.jumpForce = -11;
        this.gravity = 30;

        // Colocar en superficie
        const h = world.getHeight(0);
        this.y = h - this.h;
    }

    update(dt, input, world) {
        // Movimiento horizontal
        this.vx = 0;
        if (input.left)  this.vx -= this.speed;
        if (input.right) this.vx += this.speed;

        // Salto
        if (input.jump && this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
        }

        // Gravedad
        this.vy += this.gravity * dt;
        if (this.vy > 25) this.vy = 25;

        // Mover X con colisión
        this.moveAxis(this.vx * dt, 0, world);
        // Mover Y con colisión
        this.moveAxis(0, this.vy * dt, world);

        // Detección de suelo
        this.onGround = this.checkCollision(this.x, this.y + 0.05, world);
    }

    moveAxis(dx, dy, world) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        if (!this.checkCollision(newX, newY, world)) {
            this.x = newX;
            this.y = newY;
        } else {
            if (dx !== 0) this.vx = 0;
            if (dy !== 0) this.vy = 0;
        }
    }

    checkCollision(px, py, world) {
        const minX = Math.floor(px);
        const maxX = Math.floor(px + this.w - 0.001);
        const minY = Math.floor(py);
        const maxY = Math.floor(py + this.h - 0.001);
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                if (world.isSolid(x, y)) return true;
            }
        }
        return false;
    }
}
