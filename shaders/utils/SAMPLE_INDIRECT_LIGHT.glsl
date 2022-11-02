vec3 sampleIndirectLight(float shadowValue, sampler2D diffuseMap, sampler2D specularMap, float NdotV, float metallic, float roughness, vec3 albedo, vec3 F0){
    vec3 diffuseColor = texture(diffuseMap, texCoords).rgb;
    vec3 specularColor = texture(specularMap, texCoords).rgb * shadowValue;

    if(length(diffuseColor) != 0. || length(specularColor) != 0.){
        vec3 F  = fresnelSchlickRoughness(NdotV, F0, roughness);
        vec3 kD = (1.0 - F) * (1.0 - metallic);
        diffuseColor *= albedo * kD;
    }


    return diffuseColor + specularColor;
}


vec3 sampleProbeIndirectLight(sampler2D brdfSampler, samplerCube prefilteredMap, samplerCube irradiance, float samples, float NdotV, float metallic, float roughness, vec3 albedo, vec3 F0, vec3 V, vec3 N ){
    vec3 specular = vec3(0.);
    vec3 F  = fresnelSchlickRoughness(NdotV, F0, roughness);
    vec3 kD = (1.0 - F) * (1.0 - metallic);

    vec3 prefilteredColor = textureLod(prefilteredMap, reflect(-V, N), roughness * samples).rgb;
    vec2 brdf = texture(brdfSampler, vec2(NdotV, roughness)).rg;
    specular = prefilteredColor * (F * brdf.r + brdf.g);
    vec3 diffuse = texture(irradiance, N).rgb * albedo * kD ;

    return diffuse + specular;
}