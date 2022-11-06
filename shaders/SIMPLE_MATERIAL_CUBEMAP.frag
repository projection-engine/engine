#version 300 es

precision lowp float;
#define MAX_POINT_LIGHTS 24
#define MAX_LIGHTS 2
#define PI  3.14159265359

in vec4 worldSpacePosition;
in  vec2 texCoords;
in vec3 normalVec;
in vec3 camera;

uniform vec4 settings;
uniform sampler2D shadowMapTexture;
uniform samplerCube shadowCube;
out vec4 finalColor;

//import(fresnelSchlick)

//import(geometrySchlickGGX)

//import(distributionGGX)

//import(geometrySmith)

//import(computeLights)


void main(){
//    vec3 albedo = vec3(.5);
//
//    float roughness = .5;
//    float metallic = .5;
//    vec3 N = normalVec;
//
//    vec3 V = normalize(camera - worldSpacePosition.xyz);
//    float NdotV    = max(dot(N, V), 0.000001);
//    vec3 F0 = vec3(0.04);
//    vec3 directIllumination = vec3(0.0);
//    F0 = mix(F0, albedo, metallic);
//
//    float shadowMapsQuantity = settings.z;
//    float shadowMapResolution = settings.y;
//    int directionalLights = int(settings.x);
//    int pointLights = int(settings.w);
//
//
//    float shadows = directionalLights > 0 || pointLights > 0?  0. : 1.0;
//    float quantityToDivide = float(directionalLights) + float(pointLights);
//
//    for (int i = 0; i < directionalLights; i++){
//        vec4 lightInformation = computeDirectionalLight(shadowMapTexture, shadowMapsQuantity, shadowMapResolution, dirLightPOV[i], directionalLightsData[i], worldSpacePosition.rgb, V, F0, roughness, metallic, N, albedo);
//        directIllumination += lightInformation.rgb;
//        shadows += lightInformation.a/quantityToDivide;
//    }
//
//    float viewDistance = length(V);
//    for (int i = 0; i < pointLights; ++i){
//        vec4 lightInformation = computePointLights(shadowCube, pointLightData[i], worldSpacePosition.rgb, viewDistance, V, N, quantityToDivide, roughness, metallic, albedo, F0);
//        directIllumination += lightInformation.rgb;
//        shadows += lightInformation.a/quantityToDivide;
//    }

    finalColor = vec4(1.);
}