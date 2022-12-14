vec3 computeSpotLights (float distanceFromCamera, mat4 spotLight, vec3 V, vec3 N, float roughness, float metallic, vec3 F0) {
    vec3 lightPosition = vec3(spotLight[0][0], spotLight[0][1], spotLight[0][2]);
    vec3 lightColor = vec3(spotLight[1][0], spotLight[1][1], spotLight[1][2]);
    vec3 lightDirection = vec3(spotLight[2][0], spotLight[2][1], spotLight[2][2]);
    vec2 lightAttenuation = vec2(spotLight[3][0], spotLight[3][1]);
    float lightRadius = spotLight[3][2];
    float lightCutoff = spotLight[2][3];

    float distanceFromFrag = length(lightPosition - worldSpacePosition);
    if(distanceFromFrag > lightCutoff) return vec3(0.);

    bool hasSSS = spotLight[3][3] == 1.;
    vec3 L = normalize(lightPosition - worldSpacePosition);



    float theta = dot(L, normalize(-lightDirection));
    if (theta <= lightRadius) return vec3(0.);

    float occlusion =hasSSS ? screenSpaceShadows(-lightDirection) : 1.;
    if(occlusion < 1.) return vec3(0.);

    float attFactor = 1. / (1. + (lightAttenuation.x * distanceFromFrag) + (lightAttenuation.y * pow(distanceFromFrag, 2.)));

    return computeBRDF(lightPosition, lightColor, V, N, roughness, metallic, F0) * attFactor;
}

