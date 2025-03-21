precision mediump float;

// Uniforms
uniform vec3 u_colorStart;
uniform vec3 u_colorEnd;
uniform float u_time;


in float vAlpha;
in vec3 vPosition;

out vec4 fragColor;

void main() {
    float heightFactor = vPosition.y / 20.0;
    vec3 color = mix(u_colorStart, u_colorEnd, heightFactor);

    // Cambios dinámicos de color en el tiempo
    color += 0.1 * sin(u_time + heightFactor * 10.0);

    fragColor = vec4(color, vAlpha);
}


