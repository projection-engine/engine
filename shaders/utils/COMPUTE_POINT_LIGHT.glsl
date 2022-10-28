vec4 computePointLights (in mat4 pointLight, vec3 fragPosition, vec3 V, vec3 N, float quantityToDivide, float roughness, float metallic, vec3 albedo, vec3 F0, int index) {

    vec3 Lo = vec3(0.);
    vec3 positionPLight = vec3(pointLight[0][0], pointLight[0][1], pointLight[0][2]);
    vec3 colorPLight = vec3(pointLight[1][0], pointLight[1][1], pointLight[1][2]);

    vec3 attenuationPLight = vec3(pointLight[2][0], pointLight[2][1], pointLight[2][2]);
    float distance    = length(positionPLight - fragPosition);
    float attFactor = 1.0 / (attenuationPLight.x + (attenuationPLight.y * distance) + (attenuationPLight.z * pow(distance, 2.)));


    vec3 L = normalize(positionPLight - fragPosition);
    vec3 H = normalize(V + L);

    vec3 radiance     = colorPLight;

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



    Lo = (kD * albedo / PI + specular) * radiance * NdotL;
    return vec4(Lo, pointLight[3][2]) * attFactor;
}