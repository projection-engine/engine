#version 300 es
precision highp float;


#define MAX_LIGHTS 2

in vec2 texCoord;
flat in int dirLightsQuantity;
in mat4 dirLightPOV[MAX_LIGHTS];

uniform vec3 cameraVec;
uniform vec3 lightPosition[MAX_LIGHTS];
uniform vec3 lightColor[MAX_LIGHTS];
uniform vec3 lightAttenuationFactors[MAX_LIGHTS];
uniform int lightQuantity;

uniform samplerCube irradianceMap;
uniform samplerCube prefilteredMapSampler;

uniform sampler2D positionSampler;
uniform sampler2D normalSampler;
uniform sampler2D albedoSampler;
uniform sampler2D behaviourSampler;

struct DirectionalLight {
    vec3 direction;
    vec3 ambient;
    vec2 atlasFace;
};

uniform sampler2D brdfSampler;

uniform DirectionalLight directionalLights[MAX_LIGHTS];
out vec4 finalColor;



// PBR
const float PI = 3.14159265359;
float distributionGGX (vec3 N, vec3 H, float roughness){
    float a2    = roughness * roughness * roughness * roughness;
    float NdotH = max (dot (N, H), 0.0);
    float denom = (NdotH * NdotH * (a2 - 1.0) + 1.0);
    return a2 / (PI * denom * denom);
}
float geometrySchlickGGX (float NdotV, float roughness){
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}
float geometrySmith (vec3 N, vec3 V, vec3 L, float roughness){
    return geometrySchlickGGX (max (dot (N, L), 0.0), roughness) *
    geometrySchlickGGX (max (dot (N, V), 0.0), roughness);
}
vec3 fresnelSchlick (float cosTheta, vec3 F0){
    return F0 + (1.0 - F0) * pow (1.0 - cosTheta, 5.0);
}
vec3 fresnelSchlickRoughness (float cosTheta, vec3 F0, float roughness){
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow (1.0 - cosTheta, 5.0);
}

vec3 computeDirectionalLight(vec3 V, vec3 F0, vec3 lightDir, vec3 ambient, vec3 fragPosition, float roughness, float metallic, vec3 N, vec3 albedo){
    vec3 L = lightDir;
    vec3 H = normalize(V + L);
    float distance    = length(lightDir - fragPosition);

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

    return (kD * albedo / PI + specular) * ambient * NdotL;
}

void main() {

    ivec2 fragCoord = ivec2(gl_FragCoord.xy);

    // HACK DESGRAÇENTO ( caso fragPos seja tudo zero discarta fragment)
    vec3 fragPosition = texelFetch(positionSampler, fragCoord, 0).xyz;
    if (fragPosition.x == 0.0 && fragPosition.y == 0.0 && fragPosition.z == 0.0)
    discard;

    vec3 V = normalize(cameraVec - fragPosition);
    vec3 albedo = texture(albedoSampler, texCoord).rgb;
    vec3 N = texture(normalSampler, texCoord).rgb;
    float ao = texture(behaviourSampler, texCoord).r;
    float roughness = texture(behaviourSampler, texCoord).g;
    float metallic =texture(behaviourSampler, texCoord).b;


    float NdotV    = max(dot(N, V), 0.000001);

    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallic);

    // POINT LIGHTS
    vec3 Lo = vec3(0.0);
    for (int i = 0; i < lightQuantity; ++i){
        vec3 L = normalize(lightPosition[i] - fragPosition);
        vec3 H = normalize(V + L);
        float distance    = length(lightPosition[i] - fragPosition);
        float attFactor = 1.0 / (lightAttenuationFactors[i].x + (lightAttenuationFactors[i].y * distance) + (lightAttenuationFactors[i].z * distance * distance));
        vec3 radiance     = lightColor[i] * attFactor;

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

        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
    }

    // DIRECTIONAL LIGHT


    for (int i = 0; i < dirLightsQuantity; i++){
        vec4  fragPosLightSpace  = dirLightPOV[i] * vec4(fragPosition, 1.0);
        vec3 lightDir =  normalize(directionalLights[i].direction);

        Lo += computeDirectionalLight(
            V,
            F0,
            lightDir,
            directionalLights[i].ambient,
            fragPosition,
            roughness,
            metallic,
            N,
            albedo
        );
    }


    // DIFFUSE IBL
    vec3 F    = fresnelSchlickRoughness(NdotV, F0, roughness);
    vec3 kD = (1.0 - F) * (1.0 - metallic);
    vec3 diffuse = texture(irradianceMap, -N).rgb * albedo * kD;

    const float MAX_REFLECTION_LOD = 4.0;
    vec3 prefilteredColor = textureLod(prefilteredMapSampler, reflect(-V, N), roughness * MAX_REFLECTION_LOD).rgb;
    vec2 brdf = texture(brdfSampler, vec2(NdotV, roughness)).rg;
    vec3 specular = prefilteredColor * (F * brdf.r + brdf.g);


    vec3 ambient = (diffuse + specular) * ao;


    vec3 color =  ambient  + Lo ;
    color = color / (color + vec3(1.0));


    finalColor = vec4(color, 1.0);
}
