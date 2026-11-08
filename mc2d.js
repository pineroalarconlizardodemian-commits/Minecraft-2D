// minecraft2d.js - Versión navegador/WebView
class Minecraft2D {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.TILE = 32;
        this.WORLD_W = 100;
        this.WORLD_H = 50;
        this.GRAVITY = 0.6;
        this.JUMP = -11;
        this.SPEED = 4;

        // Tipos de bloque
        this.AIR = 0; this.DIRT = 1; this.GRASS = 2;
        this.STONE = 3; this.WOOD = 4; this.LEAVES = 5;

        this.colors = {
            1: '#8B4513', 2: '#3CB043', 3: '#808080',
            4: '#654321', 5: '#228B22'
        };

        this.world = this.generateWorld();

        this.player = {
            x: this.WORLD_W * this.TILE / 2,
            y: 0, vx: 0, vy: 0,
            w: 24, h: 48, onGround: false
        };
        this.player.y = this.findGround(this.player.x) - this.player.h;

        this.camX = 0; this.camY = 0;
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false, button: 0 };

        this.setupEvents();
        this.loop();
    }

    generateWorld() {
        const w = [];
        for (let y = 0; y < this.WORLD_H; y++) {
            w[y] = [];
            for (let x = 0; x < this.WORLD_W; x++) {
                const groundLevel = Math.floor(this.WORLD_H * 0.6 + Math.sin(x * 0.2) * 3);
                if (y < groundLevel) w[y][x] = this.AIR;
                else if (y === groundLevel) w[y][x] = this.GRASS;
                else if (y < groundLevel + 5) w[y][x] = this.DIRT;
                else w[y][x] = this.STONE;
            }
        }
        // Árboles
        for (let x = 5; x < this.WORLD_W; x += 12) {
            const gy = Math.floor(this.WORLD_H * 0.6 + Math.sin(x * 0.2) * 3);
            for (let i = 1; i <= 4; i++) w[gy - i][x] = this.WOOD;
            for (let dy = -6; dy <= -4; dy++)
                for (let dx = -2; dx <= 2; dx++)
                    if (w[gy + dy] && w[gy + dy][x + dx] === this.AIR)
                        w[gy + dy][x + dx] = this.LEAVES;
        }
        return w;
    }

    findGround(px) {
        const tx = Math.floor(px / this.TILE);
        for (let y = 0; y < this.WORLD_H; y++)
            if (this.world[y][tx] !== this.AIR) return y * this.TILE;
        return this.WORLD_H * this.TILE;
    }

    solidAt(px, py) {
        const tx = Math.floor(px / this.TILE);
        const ty = Math.floor(py / this.TILE);
        if (tx < 0 || ty < 0 || tx >= this.WORLD_W || ty >= this.WORLD_H) return true;
        return this.world[ty][tx] !== this.AIR;
    }

    rectCollides(x, y, w, h) {
        return this.solidAt(x, y) || this.solidAt(x + w - 1, y) ||
               this.solidAt(x, y + h - 1) || this.solidAt(x + w - 1, y + h - 1);
    }

    setupEvents() {
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);
        this.canvas.addEventListener('mousedown', e => {
            this.mouse.down = true; this.mouse.button = e.button;
            this.handleClick();
        });
        this.canvas.addEventListener('mouseup', () => this.mouse.down = false);
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        this.canvas.addEventListener('mousemove', e => {
            const r = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - r.left + this.camX;
            this.mouse.y = e.clientY - r.top + this.camY;
        });
    }

    handleClick() {
        const tx = Math.floor(this.mouse.x / this.TILE);
        const ty = Math.floor(this.mouse.y / this.TILE);
        if (tx < 0 || ty < 0 || tx >= this.WORLD_W || ty >= this.WORLD_H) return;
        if (this.mouse.button === 0) this.world[ty][tx] = this.AIR;    // Romper
        else if (this.mouse.button === 2) this.world[ty][tx] = this.DIRT; // Colocar
    }

    update() {
        const p = this.player;
        // Movimiento X
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) p.vx = -this.SPEED;
        else if (this.keys['ArrowRight'] || this.keys['KeyD']) p.vx = this.SPEED;
        else p.vx = 0;

        // Salto
        if ((this.keys['Space'] || this.keys['ArrowUp']) && p.onGround) {
            p.vy = this.JUMP;
            p.onGround = false;
        }

        p.vy += this.GRAVITY;
        if (p.vy > 15) p.vy = 15;

        // Colisión X
        p.x += p.vx;
        if (this.rectCollides(p.x, p.y, p.w, p.h)) p.x -= p.vx;

        // Colisión Y
        p.y += p.vy;
        p.onGround = false;
        if (this.rectCollides(p.x, p.y, p.w, p.h)) {
            if (p.vy > 0) p.onGround = true;
            p.y -= p.vy;
            p.vy = 0;
        }

        // Cámara
        this.camX = p.x + p.w / 2 - this.canvas.width / 2;
        this.camY = p.y + p.h / 2 - this.canvas.height / 2;
    }

    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const startX = Math.max(0, Math.floor(this.camX / this.TILE));
        const endX = Math.min(this.WORLD_W, Math.ceil((this.camX + this.canvas.width) / this.TILE));
        const startY = Math.max(0, Math.floor(this.camY / this.TILE));
        const endY = Math.min(this.WORLD_H, Math.ceil((this.camY + this.canvas.height) / this.TILE));

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const b = this.world[y][x];
                if (b === this.AIR) continue;
                ctx.fillStyle = this.colors[b] || '#000';
                ctx.fillRect(x * this.TILE - this.camX, y * this.TILE - this.camY,
                             this.TILE, this.TILE);
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.strokeRect(x * this.TILE - this.camX, y * this.TILE - this.camY,
                               this.TILE, this.TILE);
            }
        }

        // Jugador
        const p = this.player;
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(p.x - this.camX, p.y - this.camY, p.w, p.h);
        ctx.fillStyle = '#FFF';
        ctx.fillRect(p.x - this.camX + 4, p.y - this.camY + 8, 4, 4);
        ctx.fillRect(p.x - this.camX + 14, p.y - this.camY + 8, 4, 4);
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

// Inicialización
window.addEventListener('load', () => {
    const canvas = document.getElementById('game');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    new Minecraft2D(canvas);
});
