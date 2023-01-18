// BASED ON https://www.shadertoy.com/view/WtyBzV
float interleavedGradientNoise(vec2 n) {
    float f = 0.06711056 * n.x + 0.00583715 * n.y;
    return fract(52.9829189 * fract(f));
}
vec3 blur(sampler2D img, vec2 uv, vec2 resolution, int samples, float radius) {
    const float GOLDEN_ANGLE = 2.3999632297286533222315555066336;
    const float PI_V = 6.283185307179586476925286766559;

    float bias = interleavedGradientNoise( gl_FragCoord.xy ) * PI_V;
    float ar = resolution.x / resolution.y;
    vec3 accum = vec3(0.0);
    float samplesFloat = float(samples);

    for (int i = 1; i <= samples; ++i) {
        float I =  float(i);
        float a = I * GOLDEN_ANGLE + bias;
        vec2 p = radius *  sqrt(I / samplesFloat) * vec2( cos(a), ar *  sin(a))* 0.002 ;
        accum += texture(img, uv + p).rgb;
    }

    return accum / samplesFloat;
}
