
const vec3 sampleOffsetDirections[20] = vec3[]
(
vec3(1, 1, 1), vec3(1, -1, 1), vec3(-1, -1, 1), vec3(-1, 1, 1),
vec3(1, 1, -1), vec3(1, -1, -1), vec3(-1, -1, -1), vec3(-1, 1, -1),
vec3(1, 1, 0), vec3(1, -1, 0), vec3(-1, -1, 0), vec3(-1, 1, 0),
vec3(1, 0, 1), vec3(-1, 0, 1), vec3(1, 0, -1), vec3(-1, 0, -1),
vec3(0, 1, 1), vec3(0, -1, 1), vec3(0, -1, -1), vec3(0, 1, -1)
);
float pointLightShadow(float distanceFromCamera, float shadowFalloffDistance, samplerCube shadowMap, vec3 lightPos, mat4 lightMatrix, float viewDistance, vec3 worldPosition) {
    float attenuation = clamp(mix(1., 0., shadowFalloffDistance - distanceFromCamera), 0., 1.);
    if (attenuation == 1.) return 1.;

    float farPlane = lightMatrix[3][0];
    float bias   = lightMatrix[0][3];
    int samples  = int(lightMatrix[1][3]);

    vec3 fragToLight = worldPosition - lightPos;
    float currentDepth = length(fragToLight) / farPlane;
    if (currentDepth > 1.)
    currentDepth = 1.;

    float shadow = 0.0;
    float diskRadius = 0.05;
    for (int i = 0; i < samples; ++i){
        float closestDepth = texture(shadowMap, fragToLight + sampleOffsetDirections[i] * diskRadius).r;
        if (currentDepth - bias > closestDepth)
        shadow += 1.0;
    }
    shadow /= float(samples);

    float response = 1. - shadow;
    if (response < 1.)
    return min(1., response + attenuation);
    return response;
}


vec3 computePointLights (float distanceFromCamera, samplerCube shadowMap, mat4 pointLight, vec3 worldPosition, float viewDistance, vec3 V, vec3 N, float roughness, float metallic, vec3 albedo, vec3 F0) {
    vec3 lightPosition = vec3(pointLight[0][0], pointLight[0][1], pointLight[0][2]);

    float shadows = 1.;

    if (pointLight[3][1] == 1.)
    shadows = pointLightShadow(distanceFromCamera, pointLight[3][2], shadowMap, lightPosition, pointLight, viewDistance, worldPosition);
    if (shadows > 0.){
        float outerCutoff = pointLight[3][3];
        float cutoff = pointLight[2][2];

        vec3 lightColor = vec3(pointLight[1][0], pointLight[1][1], pointLight[1][2]);
        vec2 attenuationPLight = vec2(pointLight[2][0], pointLight[2][1]);
        float distanceFromFrag    = length(lightPosition - worldPosition);


        float intensity = 1.;
        if (distanceFromFrag > cutoff)
        intensity = clamp(mix(1., 0., (distanceFromFrag - cutoff)/(outerCutoff - cutoff)), 0., 1.);

        if (distanceFromFrag > outerCutoff)
        return vec3(0.);

        float attFactor = intensity / (1. + (attenuationPLight.x * distanceFromFrag) + (attenuationPLight.y * pow(distanceFromFrag, 2.)));

        vec3 L = normalize(lightPosition - worldPosition);
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

        return vec3(shadows * (kD * albedo / PI + specular) * lightColor * NdotL * attFactor);
    }
    return vec3(0.);
}


