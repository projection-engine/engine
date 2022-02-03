#version 300 es
precision highp float;

in vec2 texCoord;

uniform sampler2D uSampler;

out vec4 fragColor;

void main(void){
    float color = texture(uSampler, texCoord).r;
    fragColor = vec4(color, color, color, 1.0);
}