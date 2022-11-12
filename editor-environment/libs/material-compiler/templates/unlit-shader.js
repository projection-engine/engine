export default {
    static: `#version 300 es
    
precision highp float;
// IN
#define MAX_POINT_LIGHTS 24
#define MAX_LIGHTS 2
#define PI  3.14159265359 

in vec4 worldSpacePosition;
in  vec2 texCoords;
in mat3 toTangentSpace;
uniform vec3 cameraPosition;
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
