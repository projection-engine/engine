vec4 computeDirectionalLight(sampler2D shadowMap, float lightsPerShadowAtlas, float shadowAtlasResolution, mat4 lightMatrix, mat4 lightData, vec3 fragPosition, vec3 viewDirection, vec3 F0, float roughness, float metallic, vec3 surfaceNormal, vec3 albedo){
    vec3 lightDirection =  normalize(vec3(lightData[0][0], lightData[0][1], lightData[0][2]));
    vec3 lightColor =  vec3(lightData[1][0], lightData[1][1], lightData[1][2]);
    float shadows = 1.;
    if (lightData[2][2] > 0.){
        vec4 fragPosLightSpace  = lightMatrix * vec4(fragPosition, 1.0);
        vec2 atlasFace = vec2(lightData[2][0], lightData[2][1]);
        shadows = directionalLightShadows(lightData[3][0], fragPosLightSpace, atlasFace, shadowMap, lightsPerShadowAtlas, shadowAtlasResolution, lightData[2][2]);
    }

    vec3 H = normalize(viewDirection + lightDirection);
    float NDF = distributionGGX(surfaceNormal, H, roughness);
    float G   = geometrySmith(surfaceNormal, viewDirection, lightDirection, roughness);
    vec3 F    = fresnelSchlick(max(dot(H, viewDirection), 0.0), F0);
    vec3 kD = vec3(1.0) - F;
    kD *= 1.0 - metallic;

    vec3 numerator    = NDF * G * F;
    float denominator = 4.0 * max(dot(surfaceNormal, viewDirection), 0.0) * max(dot(surfaceNormal, lightDirection), 0.0) + 0.0001;
    vec3 specular     = numerator / denominator;

    float NdotL = max(dot(surfaceNormal, lightDirection), 0.0);

    return vec4((kD * albedo / PI + specular) * lightColor * NdotL, shadows);
}