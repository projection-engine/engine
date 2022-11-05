uniform sampler2D brdfSampler;
uniform sampler2D screenSpaceGI;
uniform sampler2D screenSpaceReflections;

uniform samplerCube prefilteredMap;
uniform samplerCube irradianceMap;

vec3 fresnelSchlickRoughness (float cosTheta, vec3 F0, float roughness){
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow (1.0 - cosTheta, 5.0);
}

vec3 sampleIndirectLight(float shadowValue, float NdotV, float metallic, float roughness, vec3 albedo, vec3 F0){
    vec3 diffuseColor = texture(screenSpaceGI, texCoords).rgb;
    vec3 specularColor = texture(screenSpaceReflections, texCoords).rgb * shadowValue;

    if (length(diffuseColor) != 0. || length(specularColor) != 0.){
        vec3 F  = fresnelSchlickRoughness(NdotV, F0, roughness);
        vec3 kD = (1.0 - F) * (1.0 - metallic);
        diffuseColor *= albedo * kD;
    }


    return diffuseColor + specularColor;
}

vec3 sampleProbeIndirectLight(
bool hasDiffuseProbe,
bool hasSpecularProbe,
float ambientLODSamples,
float NdotV,
float metallic,
float roughness,
vec3 albedo,
vec3 F0,
vec3 V,
vec3 N
){
    vec3 specular = vec3(0.);
    vec3 diffuse = vec3(0.);
    vec3 F  = fresnelSchlickRoughness(NdotV, F0, roughness);
    vec3 kD = (1.0 - F) * (1.0 - metallic);

    if (hasSpecularProbe){
//        vec3 prefilteredColor = textureLod(prefilteredMap, reflect(-V, N), roughness * ambientLODSamples).rgb;
//        vec2 brdf = texture(brdfSampler, vec2(NdotV, roughness)).rg;
//        specular = prefilteredColor * (F * brdf.r + brdf.g);
    }
//    if (hasDiffuseProbe)
//        diffuse = texture(irradianceMap, N).rgb * albedo * kD;

    return diffuse + specular;
}