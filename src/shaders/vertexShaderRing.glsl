// version 300 es
precision mediump float;

// Uniforms
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float u_time;
uniform float u_speed;
uniform float u_amplitude;
uniform float u_waveHeight;
uniform float u_ringAngle;
uniform float u_yAngle; 

// Attributes
in vec3 position;
in vec3 color;
in float size;

// Varyings
out float v_Alpha;
out vec3 v_Color;

void main() {
    // Convertir coordenadas cartesianas a polares
    float angle = atan(position.z, position.x);
    float radius = length(position.xz);

    // Oscilación radial
    radius += sin(u_time * 2.0 + radius * 2.0) * u_amplitude;

    // Movimiento orbital
    float angularSpeed = 0.5 + radius * (u_speed/100.0);
    angle += u_time * angularSpeed;

    vec3 newPosition = vec3(
        cos(angle) * radius, 
        position.y + sin(u_time + radius) * u_waveHeight, 
        sin(angle) * radius
    );

    // Aplicar rotación del anillo en el eje x
    mat3 rotationX = mat3(
        1.0, 0.0, 0.0,
        0.0, cos(u_ringAngle), -sin(u_ringAngle),
        0.0, sin(u_ringAngle), cos(u_ringAngle)
    );
    newPosition = rotationX * newPosition;

    // Rotación sobre el eje Y
    mat3 rotationY = mat3(
        cos(u_yAngle), 0.0, sin(u_yAngle),
        0.0, 1.0, 0.0,
        -sin(u_yAngle), 0.0, cos(u_yAngle)
    );
    newPosition = rotationY * newPosition;
    
    // Transparencia
    v_Alpha = smoothstep(10.0, 15.0, radius);

    v_Color = color;

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(newPosition, 1.0);
    gl_PointSize = size;
}
