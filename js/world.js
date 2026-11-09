const TILE_SIZE = 32;
const CHUNK_W = 16;
const WORLD_HEIGHT = 64;

class World {
    constructor() {
        // Mundo por chunks: Map<chunkX, Uint8Array>
        this.chunks = new Map();
        this.seed = Math.floor(Math.random() * 100000);
    }

    // Ruido simple pseudo-aleatorio determinístico
    noise(x, y = 0) {
        let n = x * 374761393 + y * 668265263 + this.seed * 982451653;
        n = (n ^ (n >> 13)) * 1274126177;
        n = n ^ (n >> 16);
        return (n >>> 0) / 4294967295;
    }

    // Genera altura del terreno suavizada
    getHeight(worldX) {
        const base = 20;
        const a = this.noise(worldX, 0) * 6;
        const b = this.noise(Math.floor(worldX / 4), 1) * 8;
        const c = this.noise(Math.floor(worldX / 16), 2) * 10;
        return Math.floor(base + a + b + c);
    }

    getChunk(cx) {
        if (!this.chunks.has(cx)) this.generateChunk(cx);
        return this.chunks.get(cx);
    }

    generateChunk(cx) {
        const data = new Uint8Array(CHUNK_W * WORLD_HEIGHT);
        for (let lx = 0; lx < CHUNK_W; lx++) {
            const worldX = cx * CHUNK_W + lx;
            const h = this.getHeight(worldX);

            for (let y = 0; y < WORLD_HEIGHT; y++) {
                let block = BLOCKS.AIR;
                if (y > h) {
                    if (y === h + 1) block = BLOCKS.GRASS;
                    else if (y < h + 4) block = BLOCKS.DIRT;
                    else block = BLOCKS.STONE;
                } else if (y === h + 1) {
                    block = BLOCKS.GRASS;
                }
                data[y * CHUNK_W + lx] = block;
            }

            // Árboles ocasionales
            if (this.noise(worldX, 99) > 0.92 && h > 15) {
                this.placeTree(data, lx, h, cx);
            }
        }
        this.chunks.set(cx, data);
    }

    placeTree(data, lx, groundY, cx) {
        const trunkH = 3 + Math.floor(this.noise(lx + cx * 100, 5) * 3);
        for (let i = 1; i <= trunkH; i++) {
            const y = groundY - i;
            if (y >= 0) data[y * CHUNK_W + lx] = BLOCKS.WOOD;
        }
        const topY = groundY - trunkH;
        for (let dy = -2; dy <= 0; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                if (Math.abs(dx) === 2 && dy === -2) continue;
                const nx = lx + dx;
                const ny = topY + dy;
                if (nx >= 0 && nx < CHUNK_W && ny >= 0 && ny < WORLD_HEIGHT) {
                    if (data[ny * CHUNK_W + nx] === BLOCKS.AIR) {
                        data[ny * CHUNK_W + nx] = BLOCKS.LEAVES;
                    }
                }
            }
        }
    }

    getBlock(wx, wy) {
        if (wy < 0 || wy >= WORLD_HEIGHT) return BLOCKS.AIR;
        const cx = Math.floor(wx / CHUNK_W);
        const lx = ((wx % CHUNK_W) + CHUNK_W) % CHUNK_W;
        const chunk = this.getChunk(cx);
        return chunk[wy * CHUNK_W + lx];
    }

    setBlock(wx, wy, block) {
        if (wy < 0 || wy >= WORLD_HEIGHT) return;
        const cx = Math.floor(wx / CHUNK_W);
        const lx = ((wx % CHUNK_W) + CHUNK_W) % CHUNK_W;
        const chunk = this.getChunk(cx);
        chunk[wy * CHUNK_W + lx] = block;
    }

    isSolid(wx, wy) {
        const b = this.getBlock(wx, wy);
        return BLOCK_DATA[b] && BLOCK_DATA[b].solid;
    }
                }
