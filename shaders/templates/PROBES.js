const diffuse = `
vec3 computeDiffuseIrradiance(int index, vec3 N, vec3 albedo, vec3 kD, float multiplier){
   switch(index){
        case 0:
            return texture(irradiance0, vec3(N.x, -N.y, N.z)).rgb * albedo * kD * multiplier;
        case 1:
            return texture(irradiance1, vec3(N.x, -N.y, N.z)).rgb * albedo * kD * multiplier;
        case 2:
            return texture(irradiance2, vec3(N.x, -N.y, N.z)).rgb * albedo * kD * multiplier;       
        default:
            return vec3(0.);
    }
}
vec3 irradiance(vec3 elementPosition, vec3 kD, vec3 N, vec3 albedo){
    vec3 diffuse = vec3(0.);
    int bA = 0, bB = 0, bC = 0;
    mat3 p = irradiancePositions;
    float distances[3] = float[3](
        abs(length(vec3(p[0][0],p[0][1],p[0][2]) - elementPosition)),
        abs(length(vec3(p[1][0],p[1][1],p[1][2]) - elementPosition)),
        abs(length(vec3(p[2][0],p[2][1],p[2][2]) - elementPosition))
    );

    for(int i = 0; i< 3; i++){
        if(distance[i] > distance[bA])
            bA = i;
    }
    for(int i = 0; i< 3; i++){
        if(distance[i] > distance[bB] && i != bA)
            bB = i;
    }
    for(int i = 0; i< 3; i++){
       if(i != bA && i != bB)
            bC = i;
    }
    
    diffuse += computeDiffuseIrradiance(bA, N, albedo, kD, 1.);
    diffuse += computeDiffuseIrradiance(bB, N, albedo, kD, .5);
    diffuse += computeDiffuseIrradiance(bC, N, albedo, kD, .25);
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
    
    return (irradiance(elementPosition, kD, N, albedo) + specular);
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
    return (irradiance(elementPosition, kD, N, albedo) + specular);
}
`

export const UNIFORMS = `
uniform sampler2D brdfSampler;
uniform samplerCube prefilteredMapSampler;
uniform float ambientLODSamples;

uniform samplerCube irradiance0;
uniform samplerCube irradiance1;
uniform samplerCube irradiance2;

uniform mat3 irradiancePositions;
`