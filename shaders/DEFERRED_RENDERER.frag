#version 300 es
precision highp float;

#define MAX_LIGHTS 4
#define MAX_POINT_LIGHTS 24
#define CELLSIZE 2.25
#define PI 3.14159265359
#define SH_C0 0.282094791
#define SH_C1 0.488602512
in vec2 texCoords;

/**
 * "directionalLightsData" description (mat3 array):
 *
 * Indexes 0 - 2: Light position
 * Indexes 3 - 5: Light color
 * Indexes 6 - 7: Atlas faces
 * Index 8: hasShadowMap / PCF samples (if positive it has shadow map)
 */
uniform mat3 directionalLightsData[MAX_LIGHTS];
/**
* "settings" decomposition (vec4):
 * directionalLights, shadowMapResolution, shadowMapsQuantity, pointLights
 */
uniform vec4 settings;
uniform mat4 dirLightPOV[MAX_LIGHTS];
uniform mat4 pointLightData[MAX_POINT_LIGHTS];

uniform vec3 cameraVec;
uniform bool hasAO;

uniform sampler2D shadowMapTexture;
uniform samplerCube shadowCube;
uniform sampler2D aoSampler;
uniform sampler2D positionSampler;
uniform sampler2D normalSampler;
uniform sampler2D albedoSampler;
uniform sampler2D behaviourSampler;
uniform sampler2D ambientSampler;
uniform sampler2D depthSampler;
uniform sampler2D screenSpaceReflections;
uniform sampler2D screenSpaceGI;
out vec4 finalColor;

//import(computeShadows)

//import(distributionGGX)

//import(geometrySchlickGGX)

//import(geometrySmith)

//import(fresnelSchlick)

//import(fresnelSchlickRoughness)

//import(computeDirectionalLight)

//import(computePointLight)

//import(sampleIndirectLight)


void main() {
    vec3 fragPosition = texture(positionSampler, texCoords).rgb;
    if (fragPosition.x == 0.0 && fragPosition.y == 0.0 && fragPosition.z == 0.0)
    discard;

    float shadowMapsQuantity = settings.z;
    float shadowMapResolution = settings.y;
    int directionalLights = int(settings.x);
    int pointLights = int(settings.w);

    vec3 albedo = texture(albedoSampler, texCoords).rgb;

    if (albedo.r <= 1. && albedo.g <= 1. && albedo.b <= 1.){
        vec3 directIllumination = vec3(0.0);
        vec3 indirectIllumination = vec3(0.0);
        vec3 V = normalize(cameraVec - fragPosition);
        vec3 N = texture(normalSampler, texCoords).rgb;

        float ao = texture(behaviourSampler, texCoords).r;
        if (hasAO == true)
        ao *= texture(aoSampler, texCoords).r;

        float roughness = texture(behaviourSampler, texCoords).g;
        float metallic =texture(behaviourSampler, texCoords).b;

        float NdotV    = max(dot(N, V), 0.000001);
        vec3 F0 = vec3(0.04);

        F0 = mix(F0, albedo, metallic);

        float shadows = directionalLights > 0 || pointLights > 0?  0. : 1.0;
        float quantityToDivide = float(directionalLights) + float(pointLights);
        for (int i = 0; i < directionalLights; i++){
            vec4 lightInformation = computeDirectionalLight(shadowMapTexture, shadowMapsQuantity, shadowMapResolution, dirLightPOV[i], directionalLightsData[i], fragPosition, V, F0, roughness, metallic, N, albedo);
            directIllumination += lightInformation.rgb;
            shadows += lightInformation.a/quantityToDivide;
        }

        float viewDistance = length(V);
        for (int i = 0; i < pointLights; ++i){
            vec4 lightInformation = computePointLights(shadowCube, pointLightData[i], fragPosition, viewDistance, V, N, quantityToDivide, roughness, metallic, albedo, F0);
            directIllumination += lightInformation.rgb;
            shadows += lightInformation.a/quantityToDivide;
        }

        indirectIllumination = texture(ambientSampler, texCoords).rgb + sampleIndirectLight(shadows, screenSpaceGI, screenSpaceReflections, NdotV, metallic, roughness, albedo, F0);
        finalColor = vec4(directIllumination * ao * shadows + indirectIllumination, 1.);
    }
    else
    finalColor = vec4(albedo, 1.);
}

