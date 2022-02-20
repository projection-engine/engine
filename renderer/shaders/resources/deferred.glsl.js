export const vertex = `#version 300 es
#define MAX_LIGHTS 2

in vec3 position;

struct DirectionalLightPOV {
    mat4 lightProjectionMatrix;
    mat4 lightViewMatrix;
};
uniform DirectionalLightPOV directionalLightsPOV[MAX_LIGHTS];
uniform int dirLightQuantity;
out vec2 texCoord;
out mat4 dirLightPOV[MAX_LIGHTS];
flat out int dirLightsQuantity;

void main() {
    dirLightsQuantity = dirLightQuantity;
    for (int i = 0; i< dirLightQuantity; i++){
        dirLightPOV[i] = directionalLightsPOV[i].lightProjectionMatrix * directionalLightsPOV[i].lightViewMatrix;
    }


    texCoord = (position.xy) * 0.5 + 0.5;


    gl_Position = vec4(position, 1);
}    


`

export const fragment = `#version 300 es

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

uniform float shadowMapResolution;

uniform sampler2D positionSampler;
uniform sampler2D normalSampler;
uniform sampler2D albedoSampler;
uniform sampler2D behaviourSampler;

struct DirectionalLight {
    vec3 direction;
    vec3 ambient;
    vec2 atlasFace;
};
uniform sampler2D shadowMapTexture;
uniform sampler2D previousFrameSampler;

uniform float shadowMapsQuantity;
uniform sampler2D brdfSampler;

uniform DirectionalLight directionalLights[MAX_LIGHTS];


out vec4 finalColor;


@import(sampleShadowMap)

@import(sampleShadowMapLinear)

@import(sampleSoftShadows)

@import(calculateShadows)

// PBR
const float PI = 3.14159265359;

@import(distributionGGX)

@import(geometrySchlickGGX)

@import(geometrySmith)

@import(fresnelSchlick)

@import(fresnelSchlickRoughness)

@import(computeDirectionalLight)



void main() {

    ivec2 fragCoord = ivec2(gl_FragCoord.xy);

    
    vec3 fragPosition = texture(positionSampler, texCoord).rgb;
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


    vec3 Lo = vec3(0.0);
    
    // DIRECTIONAL LIGHT
    float shadows = dirLightsQuantity > 0?  0.05 : 1.0;
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
        shadows += calculateShadows(fragPosLightSpace, directionalLights[i].atlasFace, shadowMapTexture)/float(dirLightsQuantity + 1);
    }
    Lo = Lo* shadows; 
    // POINT LIGHTS
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
  


    // DIFFUSE IBL
    vec3 F    = fresnelSchlickRoughness(NdotV, F0, roughness);
    vec3 kD = (1.0 - F) * (1.0 - metallic);
    vec3 diffuse = texture(irradianceMap, vec3(N.x, -N.y, N.z)).rgb * albedo * kD;

    const float MAX_REFLECTION_LOD = 4.0;
    vec3 prefilteredColor = textureLod(prefilteredMapSampler, reflect(-V, N), roughness * MAX_REFLECTION_LOD).rgb;
    vec2 brdf = texture(brdfSampler, vec2(NdotV, roughness)).rg;
    vec3 specular = prefilteredColor * (F * brdf.r + brdf.g);


    vec3 ambient = (diffuse + specular) * ao;// (diffuse + specular) * ao;

    // SHADOW MAP + TONEMAPPING
    vec3 color = (ambient  + Lo ) ;
    color = color / (color + vec3(1.0));


    finalColor = vec4(color, 1.0);
}
`