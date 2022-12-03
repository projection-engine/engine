vec3 computeSpotLights (float distanceFromCamera, mat4 spotLight, vec3 worldPosition, vec3 V, vec3 N, float roughness, float metallic, vec3 albedo, vec3 F0) {
    vec3 lightPosition = vec3(spotLight[0][0], spotLight[0][1], spotLight[0][2]);
    vec3 lightColor = vec3(spotLight[1][0], spotLight[1][1], spotLight[1][2]);
    vec3 lightDirection = vec3(spotLight[2][0], spotLight[2][1], spotLight[2][2]);
    vec2 lightAttenuation = vec2(spotLight[3][0], spotLight[3][1]);
    float lightCutoff = spotLight[3][2];
    bool hasSSS = spotLight[3][3] == 1.;
    vec3 L = normalize(lightPosition - worldPosition);

    float distanceFromFrag = length(lightPosition - worldPosition);

    float theta = dot(L, normalize(-lightDirection));
    if (theta <= lightCutoff)
    return vec3(0.);

    float occlusion =hasSSS ? screenSpaceShadows(-lightDirection) : 1.;
    if(occlusion < 1.) return vec3(0.);

    float attFactor = 1. / (1. + (lightAttenuation.x * distanceFromFrag) + (lightAttenuation.y * pow(distanceFromFrag, 2.)));

    vec3 H = normalize(V + L);
    float NDF = distributionGGX(N, H, roughness);
    float G   = geometrySmith(N, V, L, roughness);
    vec3 F    = fresnelSchlick(max(dot(H, V), 0.0), F0, roughness);

    vec3 kD = 1.0 - F;
    kD *= 1.0 - metallic;

    vec3 numerator    = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
    vec3 specular  = numerator / denominator;
    float NdotL = max(dot(N, L), 0.0);

    return vec3((kD * albedo / PI + specular) * lightColor * NdotL * attFactor);

}

