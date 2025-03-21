precision mediump float;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float u_intensity;
uniform float u_time;


in vec3 position; // Posición inicial
in vec3 velocity; // Velocidad de expansión
in vec3 color;    // Color de la partícula
in float size;    // Tamaño de la partícula

out vec3 vColor;

void main() {
    vec3 newPosition = position + velocity * u_time * u_intensity;

    vColor = color;

    gl_PointSize = size * (1.0 - u_time * 0.5); 
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(newPosition, 1.0);
}