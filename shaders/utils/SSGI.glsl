vec3 SSGI(int maxSteps, float stepSize, float intensity, vec2 noiseScale){
    vec3 worldNormal = normalize(texture(stochasticNormals, texCoords).rgb);
    vec3 viewPos = getViewPosition(texCoords);

    vec3 hitPos = viewPos;
    float dDepth;
    vec2 jitter = texture(noiseSampler, texCoords * noiseScale).rg;
    jitter.x = clamp(jitter.x, 0., 1.);
    jitter.y = clamp(jitter.y, 0., 1.);

    float step = stepSize * (jitter.x + jitter.y) + stepSize;
    vec4 coords = RayMarch(maxSteps, worldNormal, hitPos, dDepth, step);
    vec3 tracedAlbedo = aces(texture(previousFrame, coords.xy).rgb);

    return tracedAlbedo * intensity;
}