precision highp float;
#define PI 3.14159265359
in vec2 texCoords;

uniform sampler2D sceneColor;
uniform sampler2D entityIDSampler;
uniform float blurRadius;
uniform int samples;
uniform vec2 bufferResolution;
out vec4 fragColor;


float interleavedGradientNoise(vec2 n) {
    float f = 0.06711056 * n.x + 0.00583715 * n.y;
    return fract(52.9829189 * fract(f));
}

void main() {
    vec2 root = texture(entityIDSampler, texCoords).rg;
    if (length(root) ==0.) discard;

    const float GOLDEN_ANGLE = 2.3999632297286533222315555066336;
    const float PI2 = 6.283185307179586476925286766559;

    float bias = interleavedGradientNoise(gl_FragCoord.xy) * PI2;
    float ar = bufferResolution.x / bufferResolution.y;
    vec3 accum = vec3(0.0);
    float samplesFloat = float(samples);

    for (int i = 1; i <= samples; ++i) {
        float I = float(i);
        float a = I * GOLDEN_ANGLE + bias;
        vec2 p = blurRadius * sqrt(I / samplesFloat) * vec2(cos(a), ar * sin(a)) * 0.002;
        if (root == texture(entityIDSampler, texCoords + p).rg)
        accum += texture(sceneColor, texCoords + p).rgb;

    }

    fragColor.rgb =  accum / samplesFloat;
    fragColor.a = 1.;
}