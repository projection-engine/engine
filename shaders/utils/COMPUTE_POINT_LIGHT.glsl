vec4 computePointLights (samplerCube shadowMap, mat4 pointLight, vec3 fragPosition, float viewDistance, vec3 V, vec3 N, float quantityToDivide, float roughness, float metallic, vec3 albedo, vec3 F0) {
    vec3 lightPosition = vec3(pointLight[0][0], pointLight[0][1], pointLight[0][2]);

    float shadows = 1.;
    if (pointLight[3][1] == 1.)
    shadows = pointLightShadow(shadowMap, lightPosition, pointLight, viewDistance, fragPosition)/quantityToDivide;

    vec3 lightColor = vec3(pointLight[1][0], pointLight[1][1], pointLight[1][2]);
    vec3 attenuationPLight = vec3(pointLight[2][0], pointLight[2][1], pointLight[2][2]);
    float distance    = length(lightPosition - fragPosition);
    float attFactor = 1.0 / (attenuationPLight.x + (attenuationPLight.y * distance) + (attenuationPLight.z * pow(distance, 2.)));

    vec3 L = normalize(lightPosition - fragPosition);
    vec3 H = normalize(V + L);

    float NDF = distributionGGX(N, H, roughness);
    float G   = geometrySmith(N, V, L, roughness);
    vec3 F    = fresnelSchlick(max(dot(H, V), 0.0), F0);

    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - metallic;

    vec3 numerator    = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
    vec3 specular     = numerator / denominator;
    float NdotL = max(dot(N, L), 0.0);

    return vec4((kD * albedo / PI + specular) * lightColor * NdotL * attFactor, shadows);
}