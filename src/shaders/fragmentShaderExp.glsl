precision mediump float;

in vec3 vColor;

out vec4 fragColor;

void main() {
    vec2 coord = gl_PointCoord - vec2(0.5); // Coordenadas UV
    float dist = length(coord);

    float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
    fragColor = vec4(vColor, alpha);
}