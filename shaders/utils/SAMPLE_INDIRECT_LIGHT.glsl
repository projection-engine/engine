uniform sampler2D brdfSampler;
uniform sampler2D screenSpaceGI;
uniform sampler2D screenSpaceReflections;

uniform samplerCube prefilteredMap;
uniform samplerCube irradianceMap;

vec2 brdf = vec2(0.);

vec3 sampleIndirectLight(float shadowValue, float NdotV, float metallic, float roughness, vec3 albedo, vec3 F0){
    if (length(brdf) == 0.)
    brdf = texture(brdfSampler, vec2(NdotV,  roughness)).rg;
    vec3 diffuseColor = texture(screenSpaceGI, texCoords).rgb;
    vec3 specularColor = texture(screenSpaceReflections, texCoords).rgb * shadowValue;

    if (length(diffuseColor) != 0. || length(specularColor) != 0.){
        vec3 F  = fresnelSchlick(NdotV, F0, roughness);
        vec3 kD = (1.0 - F) * (1.0 - metallic);
        diffuseColor *= albedo * kD;
        specularColor *=  (F * brdf.r + brdf.g);
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
    vec3 F  = fresnelSchlick(NdotV, F0, roughness);
    vec3 kD = (1.0 - F) * (1.0 - metallic);

    if (hasSpecularProbe){
        //        vec3 prefilteredColor = textureLod(prefilteredMap, reflect(-V, N), roughness * ambientLODSamples).rgb;
        //        specular = prefilteredColor * (F * brdf.r + brdf.g);
    }
    //    if (hasDiffuseProbe)
    //        diffuse = texture(irradianceMap, N).rgb * albedo * kD;

    return diffuse + specular;
}