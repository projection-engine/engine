import TEMPLATE_VERTEX_SHADER from "../../static/TEMPLATE_VERTEX_SHADER";

export const fragment = `#version 300 es
precision highp float;
in vec2 texCoord;
in vec4 vPosition;
in vec3 normalVec;
in mat3 toTangentSpace;

uniform mat3 settings;
uniform mat3 rgbSamplerScales;
uniform mat3 fallbackValues;

uniform sampler2D albedo;
uniform sampler2D normal;
uniform sampler2D roughness;
uniform sampler2D metallic;
uniform sampler2D ao;
uniform sampler2D emission;
 
 
@import(ambientUniforms)

uniform vec3 cameraVec;
layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedo;
layout (location = 3) out vec4 gBehaviour; // AO ROUGHNESS METALLIC
layout (location = 4) out vec4 gAmbient;
const float PI = 3.14159265359;


@import(fresnelSchlickRoughness)

@import(ambient)

void main(){  
    gPosition = vPosition;
    gBehaviour =  vec4(vec3(0.), 1.);
    vec3 emissionValue = vec3(0.);
    
    if(settings[1][2] == 1.)
        emissionValue = texture(emission, texCoord).rgb * vec3(rgbSamplerScales[2][0], rgbSamplerScales[2][1], rgbSamplerScales[2][2]);
    else
        emissionValue = vec3(fallbackValues[2][0], fallbackValues[2][1], fallbackValues[2][2]);
         
    if(settings[0][0] == 1.)
        gAlbedo = vec4(texture(albedo, texCoord).rgb * vec3(rgbSamplerScales[0][0], rgbSamplerScales[0][1], rgbSamplerScales[0][2]), 1.);
    else
        gAlbedo = vec4(fallbackValues[0][0], fallbackValues[0][1], fallbackValues[0][2], 1.); 
    gAlbedo = vec4(gAlbedo.rgb + emissionValue, 1.);
    
    if(settings[0][1] == 1.)
        gNormal = vec4(normalize(toTangentSpace * ((texture(normal, texCoord).rgb * 2.0)- 1.0)) * vec3(rgbSamplerScales[1][0], rgbSamplerScales[1][1], rgbSamplerScales[1][2]), 1.);
    else
        gNormal = vec4(normalVec, 1.);
        
    if(settings[0][2] == 1.)
        gBehaviour.g = texture(roughness, texCoord).r * settings[2][2];
    else
        gBehaviour.g = fallbackValues[2][1];
    
    if(settings[1][0] == 1.)
        gBehaviour.b = texture(metallic, texCoord).r * settings[2][1];
    else
        gBehaviour.b = fallbackValues[2][1];
            
    if(settings[1][0] == 1.)
        gBehaviour.r = texture(ao, texCoord).r * settings[2][0];
    
    vec3 diffuse = vec3(0.);
    vec3 specular = vec3(0.);

    gAmbient = vec4(computeAmbient(cameraVec, gAlbedo.rgb,  vPosition.rgb, normalVec, gBehaviour.g, gBehaviour.b, ambientLODSamples, brdfSampler, vPosition.rgb), 1.);
}
`

export const cubeMapShader = `#version 300 es

precision highp float;
#define MAX_POINT_LIGHTS 24
#define MAX_LIGHTS 2
#define PI  3.14159265359 

in vec4 vPosition;
in  vec2 texCoord;
in mat3 toTangentSpace;
uniform int directionalLightsQuantity;
uniform mat3 directionalLightsData[MAX_LIGHTS];
uniform vec3 cameraVec;
uniform mat4 pointLightData[MAX_POINT_LIGHTS];
uniform int lightQuantity;
in vec3 normalVec;

#define PI  3.14159265359 


out vec4 finalColor;

@import(fresnelSchlick)

@import(geometrySchlickGGX)

@import(distributionGGX)

@import(geometrySmith)

@import(computeDirectionalLight) 

@import(computePointLight)

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
`

export default {
 cubeMap: cubeMapShader,
 fragment: fragment
}