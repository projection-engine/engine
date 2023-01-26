vec3 computeSpotLights (inout mat4 primaryBuffer, inout mat4 secondaryBuffer) {
    vec3 lightPosition = vec3(primaryBuffer[1]);
    vec3 lightColor = vec3(primaryBuffer[0][1], primaryBuffer[0][2], primaryBuffer[0][3]);
    vec3 lightDirection = -vec3(primaryBuffer[2]);
    vec2 lightAttenuation = vec2(primaryBuffer[3]);
    float lightRadius = primaryBuffer[3][2];
    float lightCutoff = primaryBuffer[2][3];
    vec3 offset = lightPosition - worldSpacePosition;
    bool hasSSS = primaryBuffer[3][3] == 1.;
    vec3 L = normalize(offset);

    vec4 baseContribution = precomputeContribution(lightPosition);
    if(baseContribution.a == 0.) return vec3(0.);

    float distanceFromFrag = length(offset);
    if(distanceFromFrag > lightCutoff) return vec3(0.);

    float theta = dot(L, normalize(lightDirection));
    if (theta <= lightRadius) return vec3(0.);

    float occlusion =hasSSS ? screenSpaceShadows(lightDirection) : 1.;
    if (occlusion == 0. ) return vec3(0.);

    float attFactor = 1. / (1. + (lightAttenuation.x * distanceFromFrag) + (lightAttenuation.y * pow(distanceFromFrag, 2.)));
    return computeBRDF(baseContribution.rgb, baseContribution.a, lightColor) * attFactor;
}

