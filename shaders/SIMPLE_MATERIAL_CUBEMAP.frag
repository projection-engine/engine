#version 300 es

precision highp float;
#define MAX_POINT_LIGHTS 24
#define MAX_LIGHTS 2
#define PI  3.14159265359

in vec4 vPosition;
in  vec2 texCoords;
in mat3 toTangentSpace;
uniform int directionalLightsQuantity;
uniform mat3 directionalLightsData[MAX_LIGHTS];
uniform vec3 cameraVec;
uniform mat4 pointLightData[MAX_POINT_LIGHTS];
uniform int lightQuantity;
in vec3 normalVec;

#define PI  3.14159265359


out vec4 finalColor;

//import(fresnelSchlick)

//import(geometrySchlickGGX)

//import(distributionGGX)

//import(geometrySmith)

//import(computeDirectionalLight)

//import(computePointLight)

void main(){
    vec3 albedo = vec3(.5);

    float roughness = .5;
    float metallic = .5;
    vec3 N = normalVec;

    vec3 V = normalize(cameraVec - vPosition.xyz);
    float NdotV    = max(dot(N, V), 0.000001);
    vec3 F0 = vec3(0.04);
    vec3 Lo = vec3(0.0);
    F0 = mix(F0, albedo, metallic);

    for (int i = 0; i < directionalLightsQuantity; i++){
        vec3 lightDir =  normalize(vec3(directionalLightsData[i][0][0], directionalLightsData[i][0][1],directionalLightsData[i][0][2]));
        vec3 lightColor =  vec3(directionalLightsData[i][1][0], directionalLightsData[i][1][1],directionalLightsData[i][1][2]);
        Lo += computeDirectionalLight(
        V,
        F0,
        lightDir,
        lightColor,
        vPosition.xyz,
        roughness,
        metallic,
        N,
        albedo
        );
    }

    for (int i = 0; i < lightQuantity; ++i){
        vec4 currentLightData = computePointLights(pointLightData[i],  vPosition.xyz, V, N, 1., roughness, metallic, albedo, F0, i);
        Lo += currentLightData.rgb;
    }

    finalColor = vec4(Lo, 1.);
}