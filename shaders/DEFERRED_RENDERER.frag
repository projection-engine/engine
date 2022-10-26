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
 * dirLightQuantity, shadowMapResolution, shadowMapsQuantity, lightQuantity
 */
uniform vec4 settings;


uniform mat4 dirLightPOV[MAX_LIGHTS];
uniform vec3 cameraVec;
uniform mat4 pointLightData[MAX_POINT_LIGHTS];
uniform bool hasAO;
uniform sampler2D aoSampler;
uniform samplerCube shadowCube0;
uniform samplerCube shadowCube1;
uniform sampler2D positionSampler;
uniform sampler2D normalSampler;
uniform sampler2D albedoSampler;
uniform sampler2D behaviourSampler;
uniform sampler2D ambientSampler;
uniform sampler2D depthSampler;
uniform sampler2D shadowMapTexture;
uniform sampler2D screenSpaceReflections;
uniform sampler2D screenSpaceGI;
uniform sampler2D brdfSampler;

out vec4 finalColor;

//import(distributionGGX)

//import(geometrySchlickGGX)

//import(geometrySmith)

//import(fresnelSchlick)

//import(fresnelSchlickRoughness)

//import(computeDirectionalLight)

//import(calculateShadows)

//import(computePointLight)

vec3 computeAmbientSSGI(float NdotV, float metallic, float roughness, vec3 albedo, vec3 F0, vec3 V){
    vec3 F  = fresnelSchlickRoughness(NdotV, F0, roughness);
    vec3 kD = (1.0 - F) * (1.0 - metallic);
    vec2 brdf = texture(brdfSampler, vec2(NdotV, roughness)).rg;

    return texture(screenSpaceGI, texCoords).rgb * albedo * kD;
}

void main() {
    vec3 fragPosition = texture(positionSampler, texCoords).rgb;
    if (fragPosition.x == 0.0 && fragPosition.y == 0.0 && fragPosition.z == 0.0)
    discard;
    float shadowMapsQuantity = settings.z;
    int dirLightQuantity = int(settings.x);
    float shadowMapResolution = settings.y;
    int lightQuantity = int(settings.w);
    vec3 albedo = texture(albedoSampler, texCoords).rgb;
    vec3 color;
    if (albedo.r <= 1. && albedo.g <= 1. && albedo.b <= 1.){
        vec3 V = normalize(cameraVec - fragPosition);

        vec3 N = texture(normalSampler, texCoords).rgb;
        vec3 ambient = texture(ambientSampler, texCoords).rgb;
        float ao = texture(behaviourSampler, texCoords).r;
        if (hasAO == true)
        ao *= texture(aoSampler, texCoords).r;

        float roughness = texture(behaviourSampler, texCoords).g;
        float metallic =texture(behaviourSampler, texCoords).b;

        float NdotV    = max(dot(N, V), 0.000001);
        vec3 F0 = vec3(0.04);
        vec3 Lo = vec3(0.0);

        F0 = mix(F0, albedo, metallic);

        float shadows = dirLightQuantity > 0 || lightQuantity > 0?  0. : 1.0;
        float quantityToDivide = float(dirLightQuantity) + float(lightQuantity);

        for (int i = 0; i < dirLightQuantity; i++){
            vec4 fragPosLightSpace  = dirLightPOV[i] * vec4(fragPosition, 1.0);
            vec3 lightDir =  normalize(vec3(directionalLightsData[i][0][0], directionalLightsData[i][0][1], directionalLightsData[i][0][2]));
            vec3 lightColor =  vec3(directionalLightsData[i][1][0], directionalLightsData[i][1][1], directionalLightsData[i][1][2]);


            Lo += computeDirectionalLight(
            V,
            F0,
            lightDir,
            lightColor,
            fragPosition,
            roughness,
            metallic,
            N,
            albedo
            );
            if (directionalLightsData[i][2][2] > 0.){
                vec2 atlasFace = vec2(directionalLightsData[i][2][0], directionalLightsData[i][2][1]);
                shadows += calculateShadows(fragPosLightSpace, atlasFace, shadowMapTexture, shadowMapsQuantity, shadowMapResolution, directionalLightsData[i][2][2])/quantityToDivide;
            }
            else
            shadows += 1./quantityToDivide;
        }
        float viewDistance = length(V);
        for (int i = 0; i < lightQuantity; ++i){
            mat4 lightMatrix = pointLightData[i];
            vec4 currentLightData = computePointLights(lightMatrix, fragPosition, V, N, quantityToDivide, roughness, metallic, albedo, F0, i);
            Lo += currentLightData.rgb;

            if (pointLightData[i][3][1] == 1.)
            shadows += pointLightShadow(lightMatrix, viewDistance, fragPosition)/quantityToDivide;
            else
            shadows += 1./quantityToDivide;
        }

        Lo = (Lo  + texture(screenSpaceReflections, texCoords).rgb)* shadows;

        color = (ambient  + Lo + computeAmbientSSGI(NdotV, metallic, roughness, albedo, F0, V)) * ao;

    }
    else
    color = albedo;

    finalColor = vec4(color, 1.0);
}

