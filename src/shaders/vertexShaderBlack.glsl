precision mediump float;

precision mediump float;

// Uniforms
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 u_blackHolePos;
uniform float u_turbulence;
uniform float u_time;

// Attributes
in vec3 position;
in vec3 velocity;
in vec3 color;
in float size; 

// Varyings
out vec3 vColor;

void main() {
    // Calcular dirección hacia el agujero negro
    vec3 direction = normalize(u_blackHolePos - position);

    // Añadir turbulencia al movimiento
    vec3 turbulentEffect = vec3(
        (sin(u_time + position.x * 0.1) * u_turbulence),
        (cos(u_time + position.y * 0.1) * u_turbulence),
        (sin(u_time + position.z * 0.1) * u_turbulence)
    );

    // Actualizar posición con dirección, velocidad y turbulencia
    vec3 newPosition = position + (velocity + direction + turbulentEffect) * u_time;

    vColor = color;

    gl_PointSize = size;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(newPosition, 1.0);
}

