
precision highp float;

in vec2 texCoords;

uniform sampler2D currentFrame;
uniform sampler2D gVelocity;
uniform float velocityScale;
uniform int maxSamples;

out vec4 fragColor;


void main(){
    vec2 velocity = texture(gVelocity, texCoords).rg * velocityScale;

    float speed = length(velocity * vec2(textureSize(currentFrame, 0)));
    int nSamples = max(clamp(int(speed), 1, maxSamples), 1);

    fragColor = vec4(texture(currentFrame, texCoords).rgb, 1.);

    for (int i = 1; i < nSamples; ++i) {
        vec2 offset = velocity * (float(i) / float(nSamples - 1) - 0.5);
        fragColor.rgb += texture(currentFrame, texCoords + offset).rgb;
    }
    fragColor.rgb /= float(nSamples);
}

