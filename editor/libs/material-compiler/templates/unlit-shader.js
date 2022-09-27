export default {
    static: `#version 300 es
    
precision highp float;
// IN
#define MAX_POINT_LIGHTS 24
#define MAX_LIGHTS 2
#define PI  3.14159265359 

in vec4 vPosition;
in  vec2 texCoord;
in mat3 toTangentSpace;
uniform vec3 cameraVec;
in vec3 normalVec;
in mat4 normalMatrix; 
in vec3 viewDirection;  
uniform float elapsedTime;
uniform sampler2D brdfSampler;
uniform samplerCube irradianceMap;
uniform samplerCube prefilteredMapSampler;
uniform float ambientLODSamples; 
uniform sampler2D sceneColor;

// OUTPUTS
out vec4 finalColor;
        `,
    wrapper: (body) => `

void main(){

    ${body}
    vec3 albedo = vec3(gAlbedo) * gBehaviour.r;
    albedo = albedo / (albedo + vec3(1.0));
    finalColor = vec4(albedo, 1.);
}
        `,
    inputs: "",
    functions: ""
}

export const vertex = (bodyOperations, inputs, functions) => {
    return `#version 300 es
#define MAX_LIGHTS 2
#define PI  3.14159265359 

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 uvTexture;
layout (location = 3) in vec3 tangentVec;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat3 normalMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraVec; 
uniform int dirLightQuantity;


out vec4 vPosition;
out vec2 texCoord;
out mat3 toTangentSpace;
out vec3 normalVec;  
 
${inputs}
${functions}
 

void main(){


    vPosition =  transformMatrix *   vec4(position, 1.0);
    
    vec3 T = normalize( normalMatrix  * normalize(tangentVec));
    vec3 N =  normalize(normalMatrix * normal);
    vec3 biTangent = cross(N, tangentVec); 
    vec3 B =  normalize(normalMatrix * biTangent);
    B = dot(biTangent, B)  > 0. ? -B : B;
    
    toTangentSpace = mat3(T, B, N);

    texCoord = uvTexture;
    gl_Position = vPosition;

    ${bodyOperations}
    
    gl_Position *= projectionMatrix * viewMatrix; 
}
`
}