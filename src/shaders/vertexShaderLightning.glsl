precision mediump float;

// Uniforms
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
// Uniforms
uniform float u_time;

// Attributes
in vec3 position;

// Varying para pasar datos al fragment shader
out float vAlpha;
out vec3 vPosition;

void main() {
    vec3 pos = position;

    // Movimiento ondulante para las ramificaciones
    pos.x += sin(u_time + position.y) * 0.2; // Oscilación en X
    pos.z += cos(u_time + position.y) * 0.2; // Oscilación en Z

    // Alpha dinámico para dar efecto de desvanecimiento
    vAlpha = 1.0 - (position.y / 20.0);

    // Pasar posición al fragment shader
    vPosition = position;

    // Transformación final de la posición
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
    gl_PointSize = 5.0; // Tamaño de la partícula
}
