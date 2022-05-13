export const vertex = `#version 300 es
#define MAX_LIGHTS 2
layout (location = 1) in vec3 position;
layout (location = 2) in vec3 normal;
layout (location = 3) in vec2 uvTexture;
layout (location = 4) in vec3 tangentVec;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat3 normalMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraVec; 

struct DirectionalLightPOV {
    mat4 lightProjectionMatrix;
    mat4 lightViewMatrix;
};
uniform DirectionalLightPOV directionalLightsPOV[MAX_LIGHTS];
uniform int dirLightQuantity;


out vec4 vPosition;
out vec2 texCoord;
out mat3 toTangentSpace;
out vec3 normalVec; 
out mat4 dirLightPOV[MAX_LIGHTS];
flat out int dirLightsQuantity;
 
 

void main(){
    vPosition =  transformMatrix *   vec4(position, 1.0);    
    vec3 T = normalize( normalMatrix  * normalize(tangentVec));
    vec3 N =  normalize(normalMatrix * normal);
    vec3 biTangent = cross(N, tangentVec); 
    vec3 B =  normalize(normalMatrix * biTangent);
    B = dot(biTangent, B)  > 0. ? -B : B;
    
    toTangentSpace = mat3(T, B, N);

    texCoord = uvTexture;
    gl_Position = projectionMatrix * viewMatrix * vPosition;


    dirLightsQuantity = dirLightQuantity;
    for (int i = 0; i< dirLightQuantity; i++){
        dirLightPOV[i] = directionalLightsPOV[i].lightProjectionMatrix * directionalLightsPOV[i].lightViewMatrix;
    }
}
`