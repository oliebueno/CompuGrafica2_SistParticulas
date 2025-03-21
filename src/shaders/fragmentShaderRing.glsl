precision mediump float;

//varying
in float v_Alpha;
in vec3 v_Color;

out vec4 fragColor;

vec3 normalizeColor(vec3 color) {
    return color / 255.0;
}

void main() {
    vec3 color = normalizeColor(v_Color);

    fragColor = vec4(color, v_Alpha);
}