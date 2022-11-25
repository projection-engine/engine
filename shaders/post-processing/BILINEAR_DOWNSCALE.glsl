
precision highp float;

in vec2 texCoords;
uniform sampler2D image;
uniform float multiplier;
out vec4 fragColor;
void main() {
    vec2 res = vec2(textureSize(image, 0)) * multiplier;

    vec3 col = texture(image, texCoords).rgb / 2.0;
    col += texture(image, texCoords + vec2(1., 1.) / res).rgb / 8.0;
    col += texture(image, texCoords + vec2(1., -1.) / res).rgb / 8.0;
    col += texture(image, texCoords + vec2(-1., 1.) / res).rgb / 8.0;
    col += texture(image, texCoords + vec2(-1., -1.) / res).rgb / 8.0;

    fragColor = vec4 (col, 1.0);
}