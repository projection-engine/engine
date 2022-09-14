export const vertex = `#version 300 es

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 uvTexture;
layout (location = 3) in vec3 tangentVec;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraVec;

out vec3 normalVec;
out vec3 tangent;
out vec3 bitangent;

out vec4 vPosition;
out vec2 texCoord;
 
out mat3 toTangentSpace;
out vec3 viewDirection;
 

void main(){
    vPosition =  transformMatrix *   vec4(position, 1.0);
    
    vec3 T = normalize( mat3(transformMatrix)  * normalize(tangentVec));
    vec3 N =  normalize(mat3(transformMatrix) * normal);
    vec3 biTangent = cross(N, tangentVec); 
    vec3 B =  normalize(mat3(transformMatrix) * biTangent);
    B = dot(biTangent, B)  > 0. ? -B : B;
    
    bitangent = B;
    tangent = T;
    
    toTangentSpace = mat3(T, B, N);
    
    viewDirection = transpose(toTangentSpace) * (vPosition.xyz - cameraVec);
    texCoord = uvTexture;
    
    normalVec = N; 
   
    gl_Position = projectionMatrix * viewMatrix * vPosition;
}
`
export const fallbackVertex = `#version 300 es

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal; 

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix; 

out vec3 normalVec;  
out vec4 vPosition; 

void main(){
    vPosition =  transformMatrix *   vec4(position, 1.0);
    vec3 N =  normalize(mat3(transformMatrix) * normal);
    normalVec = N; 
    gl_Position = projectionMatrix * viewMatrix * vPosition;
}
`
export const fragment = `#version 300 es
precision highp float;

in vec4 vPosition;
in vec3 normalVec; 
 
@import(ambientUniforms)

uniform vec3 cameraVec;
layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedo;
layout (location = 3) out vec4 gBehaviour;
layout (location = 4) out vec4 gAmbient;
const float PI = 3.14159265359;


@import(fresnelSchlickRoughness)

@import(ambient)

void main(){  
    gPosition = vPosition;

    gAlbedo = vec4(vec3(.5), 1.);
    gBehaviour = vec4(1.,1.,0.,1.);
    gNormal = vec4(normalVec, 1.);
    
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