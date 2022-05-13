export const deferredAmbient = `
vec3 computeAmbient(vec3 cameraVec,vec3 albedo,  vec3 vPosition,  vec3 normal, float roughness, float metallic, float samples, sampler2D brdfSampler){
   vec3 diffuse = vec3(0.);
    vec3 specular = vec3(0.);
    
    vec3 V = normalize(cameraVec - vPosition);
    float NdotV    = max(dot(normal.rgb, V), 0.000001);
    vec3 F0 = mix(vec3(0.04), albedo, metallic);
    
    vec3 F    = fresnelSchlickRoughness(NdotV, F0, roughness);
    vec3 kD = (1.0 - F) * (1.0 - metallic);
    diffuse = texture(irradianceMap, vec3(normal.x, -normal.y, normal.z)).rgb * albedo * kD;
    
    vec3 prefilteredColor = textureLod(prefilteredMapSampler, reflect(-V, normal.rgb), roughness * samples).rgb;
    vec2 brdf = texture(brdfSampler, vec2(NdotV, roughness)).rg;
    specular = prefilteredColor * (F * brdf.r + brdf.g);
    
    return (diffuse + specular);
}
`

export const forwardAmbient = `
vec3 computeAmbient(float NdotV, float metallic, float roughness, vec3 albedo, vec3 F0, vec3 V, vec3 N, float samples, sampler2D brdfSampler){
    vec3 diffuse = vec3(0.);
    vec3 specular = vec3(0.);
    vec3 F    = fresnelSchlickRoughness(NdotV, F0, roughness);
    vec3 kD = (1.0 - F) * (1.0 - metallic);
    diffuse = texture(irradianceMap, vec3(N.x, -N.y, N.z)).rgb * albedo * kD;

    vec3 prefilteredColor = textureLod(prefilteredMapSampler, reflect(-V, N.rgb), roughness * samples).rgb;
    vec2 brdf = texture(brdfSampler, vec2(NdotV, roughness)).rg;
    specular = prefilteredColor * (F * brdf.r + brdf.g);
    return (diffuse + specular);
}
`

export const UNIFORMS = `
uniform sampler2D brdfSampler;
uniform samplerCube irradianceMap;
uniform samplerCube prefilteredMapSampler;
uniform float ambientLODSamples;
`