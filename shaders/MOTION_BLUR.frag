#version 300 es
precision highp float;
#define MAX_SAMPLES 10

in vec2 texCoords;

uniform sampler2D currentFrame;
uniform sampler2D gVelocity;
uniform float velocityScale;

out vec4 fragColor;


void main(){
    vec2 texelSize = 1.0 / vec2(textureSize(currentFrame, 0));
    vec2 screenTexCoords = gl_FragCoord.xy * texelSize;

    vec2 velocity = texture(gVelocity, screenTexCoords).rg;
velocity *= velocityScale;

    float speed = length(velocity / texelSize);
    int nSamples = clamp(int(speed), 1, MAX_SAMPLES);

    fragColor = texture(currentFrame, screenTexCoords);
    for (int i = 1; i < nSamples; ++i) {
        vec2 offset = velocity * (float(i) / float(nSamples - 1) - 0.5);
        fragColor += texture(currentFrame, screenTexCoords + offset);
    }
    fragColor /= float(nSamples);
}

