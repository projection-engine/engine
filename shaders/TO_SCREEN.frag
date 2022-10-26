#version 300 es
precision lowp float;

in vec2 texCoords;

uniform sampler2D uSampler;
out vec4 finalColor;

void main() {
    vec3 fragment = texture(uSampler, texCoords).rgb;
    finalColor = vec4(fragment, 1.0);
}