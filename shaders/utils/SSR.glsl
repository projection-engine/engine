vec3 SSR(int maxSteps, float falloff, float minRayStep, float stepSize){

    vec3 behaviour = texture(gBehaviour, texCoords).rgb;
    float metallic = behaviour.b;
    float roughness = behaviour.g;

    if (metallic < 0.01)
    return vec3(0.);

    vec3 worldNormal =normalize(texture(gNormal, texCoords) * invViewMatrix).rgb;
    vec3 viewPos = getViewPosition(texCoords);
    vec3 reflected = normalize(reflect(normalize(viewPos), normalize(worldNormal)));

    vec3 hitPos = viewPos;
    float dDepth;
    vec3 jitt = mix(vec3(0.0), vec3(hash(viewPos)), roughness);
    vec4 coords = RayMarch(maxSteps, (vec3(jitt) + reflected * max(minRayStep, -viewPos.z)), hitPos, dDepth, stepSize);

    vec2 dCoords = smoothstep(CLAMP_MIN, CLAMP_MAX, abs(vec2(0.5) - coords.xy));
    float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);
    float reflectionMultiplier = pow(metallic, falloff) * screenEdgefactor * -reflected.z;
    vec3 tracedAlbedo = texture(previousFrame, coords.xy).rgb;

    return tracedAlbedo * clamp(reflectionMultiplier, 0.0, 0.9);
}

