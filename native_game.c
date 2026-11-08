// native_game.c - Juego estilo Minecraft 2D en C nativo para Android (NDK)
#include <jni.h>
#include <android/log.h>
#include <GLES3/gl3.h>
#include <math.h>
#include <stdlib.h>
#include <time.h>

#define LOG_TAG "MC2D_NDK"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)

#define TILE 48
#define WORLD_W 100
#define WORLD_H 50

// Tipos de bloques
#define AIR 0
#define DIRT 1
#define GRASS 2
#define STONE 3
#define WOOD 4
#define LEAVES 5

typedef struct {
    int world[WORLD_H][WORLD_W];
    float px, py, vx, vy;
    float pw, ph;
    int onGround;
    float camX, camY;
    int screenW, screenH;
    int leftPressed, rightPressed, jumpPressed;
} GameState;

static GameState game;

// --- SHADERS BÁSICOS OPENGL ES 3.0 ---
const char* vertexShaderSource = 
    "#version 300 es\n"
    "layout(location = 0) in vec2 aPos;\n"
    "layout(location = 1) in vec3 aColor;\n"
    "uniform mat4 uProjection;\n"
    "out vec3 vColor;\n"
    "void main() {\n"
    "   gl_Position = uProjection * vec4(aPos, 0.0, 1.0);\n"
    "   vColor = aColor;\n"
    "}\n";

const char* fragmentShaderSource = 
    "#version 300 es\n"
    "precision mediump float;\n"
    "in vec3 vColor;\n"
    "out vec4 FragColor;\n"
    "void main() {\n"
    "   FragColor = vec4(vColor, 1.0);\n"
    "}\n";

static GLuint program;
static GLuint vao, vbo;

void generate_world() {
    for (int y = 0; y < WORLD_H; y++) {
        for (int x = 0; x < WORLD_W; x++) {
            int ground = (int)(WORLD_H * 0.6 + sin(x * 0.2) * 3);
            if (y < ground) game.world[y][x] = AIR;
            else if (y == ground) game.world[y][x] = GRASS;
            else if (y < ground + 5) game.world[y][x] = DIRT;
            else game.world[y][x] = STONE;
        }
    }
    
    // Árboles
    for (int x = 5; x < WORLD_W; x += 12) {
        int gy = (int)(WORLD_H * 0.6 + sin(x * 0.2) * 3);
        for (int i = 1; i <= 4 && gy - i >= 0; i++) game.world[gy - i][x] = WOOD;
        for (int dy = -6; dy <= -4; dy++) {
            for (int dx = -2; dx <= 2; dx++) {
                int yy = gy + dy, xx = x + dx;
                if (yy >= 0 && yy < WORLD_H && xx >= 0 && xx < WORLD_W && game.world[yy][xx] == AIR)
                    game.world[yy][xx] = LEAVES;
            }
        }
    }
}

JNIEXPORT void JNICALL
Java_com_example_mc2d_GameRenderer_nativeInit(JNIEnv *env, jobject thiz, jint width, jint height) {
    game.screenW = width;
    game.screenH = height;
    game.px = WORLD_W * TILE / 2.0f;
    game.py = WORLD_H * TILE * 0.4f; // Ajustar según mundo
    game.pw = 36.0f;
    game.ph = 72.0f;
    game.vx = 0; game.vy = 0;
    game.onGround = 0;
    
    generate_world();

    // Compilar shaders
    GLuint vs = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vs, 1, &vertexShaderSource, NULL);
    glCompileShader(vs);

    GLuint fs = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(fs, 1, &fragmentShaderSource, NULL);
    glCompileShader(fs);

    program = glCreateProgram();
    glAttachShader(program, vs);
    glAttachShader(program, fs);
    glLinkProgram(program);

    glGenVertexArrays(1, &vao);
    glGenBuffers(1, &vbo);

    LOGI("Juego inicializado: %dx%d", width, height);
}

JNIEXPORT void JNICALL
Java_com_example_mc2d_GameRenderer_nativeUpdate(JNIEnv *env, jobject thiz, jfloat deltaTime) {
    float GRAVITY = 40.0f; // Ajustado a deltaTime
    float JUMP = -20.0f;
    float SPEED = 250.0f;

    // Movimiento horizontal
    if (game.leftPressed) game.vx = -SPEED;
    else if (game.rightPressed) game.vx = SPEED;
    else game.vx = 0;

    // Salto
    if (game.jumpPressed && game.onGround) {
        game.vy = JUMP;
        game.onGround = 0;
    }

    // Gravedad
    game.vy += GRAVITY * deltaTime;
    if (game.vy > 500.0f) game.vy = 500.0f;

    // Actualizar posición X
    game.px += game.vx * deltaTime;
    // TODO: Colisiones X

    // Actualizar posición Y
    game.py += game.vy * deltaTime;
    // TODO: Colisiones Y
    // Simplificación: asumir que toca el suelo
    if (game.py > WORLD_H * TILE * 0.4f) {
        game.py = WORLD_H * TILE * 0.4f;
        game.vy = 0;
        game.onGround = 1;
    }

    // Cámara
    game.camX = game.px + game.pw / 2.0f - game.screenW / 2.0f;
    game.camY = game.py + game.ph / 2.0f - game.screenH / 2.0f;
    if (game.camX < 0) game.camX = 0;
    if (game.camY < 0) game.camY = 0;
}

JNIEXPORT void JNICALL
Java_com_example_mc2d_GameRenderer_nativeRender(JNIEnv *env, jobject thiz) {
    glClearColor(0.53f, 0.81f, 0.92f, 1.0f); // Cielo celeste
    glClear(GL_COLOR_BUFFER_BIT);

    glUseProgram(program);

    // Matriz de proyección ortográfica
    float left = game.camX;
    float right = game.camX + game.screenW;
    float bottom = game.camY + game.screenH;
    float top = game.camY;
    
    float proj[16] = {
        2.0f / (right - left), 0, 0, 0,
        0, 2.0f / (top - bottom), 0, 0,
        0, 0, -1, 0,
        -(right + left) / (right - left), -(top + bottom) / (top - bottom), 0, 1
    };
    
    GLint projLoc = glGetUniformLocation(program, "uProjection");
    glUniformMatrix4fv(projLoc, 1, GL_FALSE, proj);

    // Dibujar bloques (simplificado)
    glBindVertexArray(vao);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);

    // Solo dibujamos el jugador como prueba en este ejemplo
    float playerVerts[] = {
        game.px, game.py, 1.0f, 0.0f, 0.0f,
        game.px + game.pw, game.py, 1.0f, 0.0f, 0.0f,
        game.px, game.py + game.ph, 1.0f, 0.0f, 0.0f,
        game.px + game.pw, game.py, 1.0f, 0.0f, 0.0f,
        game.px + game.pw, game.py + game.ph, 1.0f, 0.0f, 0.0f,
        game.px, game.py + game.ph, 1.0f, 0.0f, 0.0f
    };

    glBufferData(GL_ARRAY_BUFFER, sizeof(playerVerts), playerVerts, GL_DYNAMIC_DRAW);
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(1);
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)(2 * sizeof(float)));
    
    glDrawArrays(GL_TRIANGLES, 0, 6);
}

// --- Controles táctiles ---
JNIEXPORT void JNICALL
Java_com_example_mc2d_GameRenderer_nativeTouch(JNIEnv *env, jobject thiz, jint action, jfloat x, jfloat y) {
    if (action == 0) { // DOWN / MOVE
        game.leftPressed = (x < game.screenW * 0.2f && y > game.screenH * 0.6f);
        game.rightPressed = (x < game.screenW * 0.4f && y > game.screenH * 0.6f && x >= game.screenW * 0.2f);
        game.jumpPressed = (x > game.screenW * 0.8f && y > game.screenH * 0.6f);
    } else if (action == 1) { // UP
        game.leftPressed = 0;
        game.rightPressed = 0;
        game.jumpPressed = 0;
    }
}
