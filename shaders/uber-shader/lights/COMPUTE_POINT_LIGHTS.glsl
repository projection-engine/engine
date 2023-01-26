const vec3 sampleOffsetDirections[20] = vec3[]
(
    vec3(1, 1, 1), vec3(1, -1, 1), vec3(-1, -1, 1), vec3(-1, 1, 1),
    vec3(1, 1, -1), vec3(1, -1, -1), vec3(-1, -1, -1), vec3(-1, 1, -1),
    vec3(1, 1, 0), vec3(1, -1, 0), vec3(-1, -1, 0), vec3(-1, 1, 0),
    vec3(1, 0, 1), vec3(-1, 0, 1), vec3(1, 0, -1), vec3(-1, 0, -1),
    vec3(0, 1, 1), vec3(0, -1, 1), vec3(0, -1, -1), vec3(0, 1, -1)
);
float pointLightShadow(float distanceFromCamera, float shadowFalloffDistance, vec3 lightPos, float bias, mat4 lightMatrix) {
    float attenuation = clamp(mix(1., 0., shadowFalloffDistance - distanceFromCamera), 0., 1.);
    if (attenuation == 1.) return 1.;

    float farPlane = lightMatrix[3][0];
    int samples = int(lightMatrix[1][3]);

    vec3 fragToLight = worldSpacePosition - lightPos;
    float currentDepth = length(fragToLight) / farPlane;
    if (currentDepth > 1.)
    currentDepth = 1.;

    float shadow = 0.0;
    float diskRadius = 0.05;
    for (int i = 0; i < samples; ++i) {
        float closestDepth = texture(shadow_cube, fragToLight + sampleOffsetDirections[i] * diskRadius).r;
        if (currentDepth - bias > closestDepth)
        shadow += 1.0;
    }
    shadow /= float(samples);

    float response = 1. - shadow;
    if (response < 1.)
    return min(1., response + attenuation);
    return response;
}


vec3 computePointLights(inout mat4 primaryBuffer, inout mat4 secondaryBuffer) {
    vec3 lightPosition = vec3(primaryBuffer[1][0], primaryBuffer[1][1], primaryBuffer[1][2]);
    vec3 lightColor = vec3(primaryBuffer[0][1], primaryBuffer[0][2], primaryBuffer[0][3]);

    vec4 baseContribution = precomputeContribution(lightPosition);
    if (baseContribution.a == 0.) return vec3(0.);

    float shadows = 1.;
    bool hasShadowMap = primaryBuffer[3][1] < 0.;
    bool hasSSS = abs(primaryBuffer[3][1]) == 2.;

    if (hasShadowMap) shadows = pointLightShadow(distanceFromCamera, primaryBuffer[3][2], lightPosition, secondaryBuffer[0][0], primaryBuffer);

    if (shadows == 0.) return vec3(0.);

    float cutoff = primaryBuffer[3][3];
    float outerCutoff = primaryBuffer[2][2];
    float occlusion = hasSSS ? screenSpaceShadows(lightPosition - worldSpacePosition) : 1.;

    if (occlusion == 0.) return vec3(0.);

    vec2 attenuationPLight = vec2(primaryBuffer[2][0], primaryBuffer[2][1]);
    float distanceFromFrag = length(lightPosition - worldSpacePosition);
    float intensity = 1.;

    if (distanceFromFrag > outerCutoff) return vec3(0.);
    if (distanceFromFrag > cutoff)
    intensity = clamp(mix(1., 0., (distanceFromFrag - cutoff) / (outerCutoff - cutoff)), 0., 1.);


    float attFactor = intensity / (1. + (attenuationPLight.x * distanceFromFrag) + (attenuationPLight.y * pow(distanceFromFrag, 2.)));
    if (attFactor == 0.) return vec3(0.);
    return computeBRDF(baseContribution.rgb, baseContribution.a, lightColor) * attFactor;
}


