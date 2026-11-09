const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const world = new World();
const player = new Player(world);

let selectedBlock = HOTBAR[0];
let camera = { x: 0, y: 0 };
let lastTime = performance.now();
let fpsCounter = 0, fpsTime = 0, fps = 0;
let dpr = window.devicePixelRatio || 1;

const input = { left: false, right: false, jump: false };

// --- Redimensionar canvas ---
function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resize);
resize();

// --- Hotbar UI ---
function buildHotbar() {
    const bar = document.getElementById('hotbar');
    bar.innerHTML = '';
    HOTBAR.forEach((b, i) => {
        const div = document.createElement('div');
        div.className = 'slot' + (b === selectedBlock ? ' active' : '');
        div.style.background = BLOCK_DATA[b].color;
        div.textContent = BLOCK_DATA[b].name;
        div.addEventListener('click', () => {
            selectedBlock = b;
            document.getElementById('selected').textContent = BLOCK_DATA[b].name;
            buildHotbar();
        });
        bar.appendChild(div);
    });
}
buildHotbar();

// --- LÓGICA DEL JOYSTICK ---
const joyBase = document.getElementById('joystick-base');
const joyKnob = document.getElementById('joystick-knob');
let joyActive = false;
let joyCenter = { x: 0, y: 0 };
const maxDist = 35; // Distancia máxima que se puede mover el círculo interior

joyBase.addEventListener('touchstart', (e) => {
    e.preventDefault();
    joyActive = true;
    const rect = joyBase.getBoundingClientRect();
    joyCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    moveJoystick(e.touches[0].clientX, e.touches[0].clientY);
});

joyBase.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (joyActive) moveJoystick(e.touches[0].clientX, e.touches[0].clientY);
});

joyBase.addEventListener('touchend', (e) => {
    e.preventDefault();
    joyActive = false;
    joyKnob.style.transform = `translate(-50%, -50%)`;
    input.left = false;
    input.right = false;
});

function moveJoystick(touchX, touchY) {
    let dx = touchX - joyCenter.x;
    let dy = touchY - joyCenter.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
    }
    joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    // Umbral de movimiento (10px) para evitar vibraciones
    if (dx < -10) input.left = true; else input.left = false;
    if (dx > 10) input.right = true; else input.right = false;
}

// --- LÓGICA DE BOTONES (Saltar, Poner, Romper) ---
const btnJump = document.getElementById('btn-jump');
const btnBreak = document.getElementById('btn-break');
const btnPlace = document.getElementById('btn-place');

btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); input.jump = true; });
btnJump.addEventListener('touchend', (e) => { e.preventDefault(); input.jump = false; });

// Centro del jugador en la pantalla para calcular qué bloque tocar
function getPlayerScreenCoords() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const px = (player.x + player.w / 2 - camera.x) * TILE_SIZE;
    const py = (player.y + player.h / 2 - camera.y) * TILE_SIZE;
    return { px, py };
}

btnBreak.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const { px, py } = getPlayerScreenCoords();
    // Busca romper en un radio de 2.5 bloques alrededor del centro del jugador
    const blockX = Math.floor(camera.x + (px + 32) / TILE_SIZE); // Un poco a la derecha
    const blockY = Math.floor(camera.y + py / TILE_SIZE);
    
    if (world.isSolid(blockX, blockY) || world.getBlock(blockX, blockY) !== BLOCKS.AIR) {
        world.setBlock(blockX, blockY, BLOCKS.AIR);
    }
});

btnPlace.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const { px, py } = getPlayerScreenCoords();
    const blockX = Math.floor(camera.x + (px + 32) / TILE_SIZE);
    const blockY = Math.floor(camera.y + py / TILE_SIZE);

    if (world.getBlock(blockX, blockY) === BLOCKS.AIR) {
        // Verifica que haya un bloque cerca para no construir en el aire
        const neighbors = [[1,0],[-1,0],[0,1],[0,-1]];
        const adjacent = neighbors.some(([dx, dy]) => world.isSolid(blockX + dx, blockY + dy));
        if (adjacent) {
            world.setBlock(blockX, blockY, selectedBlock);
        }
    }
});

// --- TAP EN EL MUNDO (Para PC o toques fuera de los botones) ---
canvas.addEventListener('touchstart', (e) => {
    // Si tocas el canvas (fuera de los controles), rompe/coloca bloques
    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    
    const worldX = Math.floor(camera.x + x / TILE_SIZE);
    const worldY = Math.floor(camera.y + y / TILE_SIZE);
    const block = world.getBlock(worldX, worldY);
    
    if (block !== BLOCKS.AIR) {
        world.setBlock(worldX, worldY, BLOCKS.AIR);
    } else {
        const neighbors = [[1,0],[-1,0],[0,1],[0,-1]];
        const adjacent = neighbors.some(([dx, dy]) => world.isSolid(worldX + dx, worldY + dy));
        if (adjacent) world.setBlock(worldX, worldY, selectedBlock);
    }
}, { passive: false });

// --- TECLADO (Solo para probar en la PC) ---
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') input.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') input.right = true;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') input.jump = true;
    if (e.key >= '1' && e.key <= '6') {
        selectedBlock = HOTBAR[parseInt(e.key) - 1];
        document.getElementById('selected').textContent = BLOCK_DATA[selectedBlock].name;
        buildHotbar();
    }
});
window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') input.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') input.right = false;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') input.jump = false;
});

// --- Render ---
function render() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Cielo
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, w, h);

    // Cámara
    camera.x = player.x + player.w / 2 - (w / TILE_SIZE) / 2;
    camera.y = player.y + player.h / 2 - (h / TILE_SIZE) / 2;

    const startX = Math.floor(camera.x) - 1;
    const endX = Math.ceil(camera.x + w / TILE_SIZE) + 1;
    const startY = Math.floor(camera.y) - 1;
    const endY = Math.ceil(camera.y + h / TILE_SIZE) + 1;

    // Bloques
    for (let y = Math.max(0, startY); y <= Math.min(WORLD_HEIGHT - 1, endY); y++) {
        for (let x = startX; x <= endX; x++) {
            const b = world.getBlock(x, y);
            if (b === BLOCKS.AIR) continue;
            const data = BLOCK_DATA[b];
            if (!data.color) continue;
            const sx = (x - camera.x) * TILE_SIZE;
            const sy = (y - camera.y) * TILE_SIZE;
            ctx.fillStyle = data.color;
            ctx.fillRect(Math.floor(sx), Math.floor(sy), TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.strokeRect(Math.floor(sx) + 0.5, Math.floor(sy) + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        }
    }

    // Jugador
    const px = (player.x - camera.x) * TILE_SIZE;
    const py = (player.y - camera.y) * TILE_SIZE;
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(px, py, player.w * TILE_SIZE, player.h * TILE_SIZE);
    // Ojos
    ctx.fillStyle = '#fff';
    ctx.fillRect(px + 4, py + 6, 6, 6);
    ctx.fillRect(px + player.w * TILE_SIZE - 10, py + 6, 6, 6);
}

// --- Loop ---
function loop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    player.update(dt, input, world);
    render();

    fpsCounter++;
    fpsTime += dt;
    if (fpsTime >= 0.5) {
        fps = Math.round(fpsCounter / fpsTime);
        document.getElementById('fps').textContent = fps;
        fpsCounter = 0;
        fpsTime = 0;
    }

    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
