const diffuse = `
vec3 computeDiffuseIrradiance(vec3 N, vec3 albedo, vec3 kD){
    vec3 diffuse = texture(irradiance0, vec3(N.x, -N.y, N.z)).rgb * albedo * kD  * irradianceMultiplier.x;
    diffuse += texture(irradiance1, vec3(N.x, -N.y, N.z)).rgb * albedo * kD * .75 * irradianceMultiplier.y;    
    diffuse += texture(irradiance2, vec3(N.x, -N.y, N.z)).rgb * albedo * kD * .25 * irradianceMultiplier.z;       
    return diffuse;
}
`

export const deferredAmbient = `
${diffuse}
vec3 computeAmbient(vec3 cameraVec,vec3 albedo,  vec3 vPosition,  vec3 normal, float roughness, float metallic, float samples, sampler2D brdfSampler, vec3 elementPosition){

    vec3 specular = vec3(0.);
    
    vec3 V = normalize(cameraVec - vPosition);
    float NdotV    = max(dot(normal.rgb, V), 0.000001);
    vec3 F0 = mix(vec3(0.04), albedo, metallic);
    
    vec3 F    = fresnelSchlickRoughness(NdotV, F0, roughness);
    vec3 kD = (1.0 - F) * (1.0 - metallic);
 
    vec3 prefilteredColor = textureLod(prefilteredMapSampler, reflect(-V, normal.rgb), roughness * samples).rgb;
    vec2 brdf = texture(brdfSampler, vec2(NdotV, roughness)).rg;
    specular = prefilteredColor * (F * brdf.r + brdf.g);
    
    return (computeDiffuseIrradiance( N, albedo, kD) + specular);
}
`

export const forwardAmbient = `
${diffuse}
vec3 computeAmbient(float NdotV, float metallic, float roughness, vec3 albedo, vec3 F0, vec3 V, vec3 N, float samples, sampler2D brdfSampler, vec3 elementPosition){
    vec3 specular = vec3(0.);
    vec3 F    = fresnelSchlickRoughness(NdotV, F0, roughness);
    vec3 kD = (1.0 - F) * (1.0 - metallic);

    vec3 prefilteredColor = textureLod(prefilteredMapSampler, reflect(-V, N.rgb), roughness * samples).rgb;
    vec2 brdf = texture(brdfSampler, vec2(NdotV, roughness)).rg;
    specular = prefilteredColor * (F * brdf.r + brdf.g);
    return (computeDiffuseIrradiance(N, albedo, kD) + specular);
}
`

export const UNIFORMS = `
uniform sampler2D brdfSampler;
uniform samplerCube prefilteredMapSampler;
uniform float ambientLODSamples;

uniform vec3 irradianceMultiplier;
uniform samplerCube irradiance0;
uniform samplerCube irradiance1;
uniform samplerCube irradiance2;
`