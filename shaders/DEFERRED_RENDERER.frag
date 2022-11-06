#version 300 es
precision highp float;

#define MAX_LIGHTS 4
#define PI 3.14159265359

in vec2 texCoords;

uniform PointLights{
    mat4 pointLights[24];
    int pointLightsQuantity;
};

uniform DirectionalLights{
    mat4 directionalLights[16];
    mat4 directionalLightsPOV[16];
    int directionalLightsQuantity;
    float shadowMapsQuantity;
    float shadowMapResolution;
};

uniform DeferredSettings{

    float ambientLODSamples;
    bool hasAO;
    bool hasDiffuseProbe;
    bool hasSpecularProbe;
};

uniform vec3 cameraPosition;

uniform sampler2D albedoSampler;
uniform sampler2D aoSampler;
uniform sampler2D behaviourSampler;
uniform sampler2D normalSampler;
uniform sampler2D positionSampler;
uniform sampler2D shadowMapTexture;
uniform samplerCube shadowCube;


//import(fresnelSchlick)

//import(sampleIndirectLight)

//import(distributionGGX)

//import(geometrySchlickGGX)

//import(geometrySmith)



//import(computeLights)




out vec4 finalColor;
void main() {
    vec4 pixelPosition = texture(positionSampler, texCoords);
    if (pixelPosition.a < 1.)
    discard;
    vec3 fragPosition = pixelPosition.rgb;

    vec3 albedo = texture(albedoSampler, texCoords).rgb;
    if (albedo.r > 1. && albedo.g > 1. && albedo.b > 1.)
        finalColor = vec4(albedo, 1.);
    else{
        vec3 directIllumination = vec3(0.0);
        vec3 indirectIllumination = vec3(0.0);
        vec3 V = normalize(cameraPosition - fragPosition);
        vec3 N = texture(normalSampler, texCoords).rgb;

        float ao = texture(behaviourSampler, texCoords).r;
        if (hasAO == true)
        ao *= texture(aoSampler, texCoords).r;

        float roughness = texture(behaviourSampler, texCoords).g;
        float metallic =texture(behaviourSampler, texCoords).b;

        float NdotV    = max(dot(N, V), 0.000001);
        vec3 F0 = vec3(0.04);

        F0 = mix(F0, albedo, metallic);

        float shadows = directionalLightsQuantity > 0 || pointLightsQuantity > 0?  0. : 1.0;
        float quantityToDivide = float(directionalLightsQuantity) + float(pointLightsQuantity);
        for (int i = 0; i < directionalLightsQuantity; i++){
            vec4 lightInformation = computeDirectionalLight(shadowMapTexture, shadowMapsQuantity, shadowMapResolution, directionalLightsPOV[i], directionalLights[i], fragPosition, V, F0, roughness, metallic, N, albedo);
            directIllumination += lightInformation.rgb;
            shadows += lightInformation.a/quantityToDivide;
        }

        float viewDistance = length(V);
        for (int i = 0; i < int(pointLightsQuantity); ++i){
            vec4 lightInformation = computePointLights(shadowCube, pointLights[i], fragPosition, viewDistance, V, N, quantityToDivide, roughness, metallic, albedo, F0);
            directIllumination += lightInformation.rgb;
            shadows += lightInformation.a/quantityToDivide;
        }

        indirectIllumination = sampleIndirectLight(shadows, NdotV, metallic, roughness, albedo, F0);
        if (hasDiffuseProbe || hasSpecularProbe)
            indirectIllumination += sampleProbeIndirectLight(
                hasDiffuseProbe,
                hasSpecularProbe,
                ambientLODSamples,
                NdotV,
                metallic,
                roughness,
                albedo,
                F0,
                V,
                N
            );
        finalColor = vec4(directIllumination * ao * shadows + indirectIllumination, 1.);
    }
}

