vec3 computeDirectionalLight(vec3 V, vec3 F0, vec3 lightDir, vec3 ambient, vec3 fragPosition, float roughness, float metallic, vec3 N, vec3 albedo){
    vec3 H = normalize(V + lightDir);

    float NDF = distributionGGX(N, H, roughness);
    float G   = geometrySmith(N, V, lightDir, roughness);
    vec3 F    = fresnelSchlick(max(dot(H, V), 0.0), F0);
    vec3 kD = vec3(1.0) - F;
    kD *= 1.0 - metallic;

    vec3 numerator    = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, lightDir), 0.0) + 0.0001;
    vec3 specular     = numerator / denominator;

    float NdotL = max(dot(N, lightDir), 0.0);

    return (kD * albedo / PI + specular) * ambient * NdotL;
}