export default {
    static: `
#version 300 es
precision highp float;
    
#define PI  3.14159265359

in vec4 previousScreenPosition;
in vec4 currentScreenPosition;
 
in vec3 normalVec;
in mat4 normalMatrix;
in mat3 toTangentSpace;
in vec3 viewDirection;
in vec2 texCoords;
in vec3 meshID;
in vec4 worldSpacePosition;
uniform float elapsedTime; 
uniform vec3 cameraPosition;

layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedo;
layout (location = 3) out vec4 gBehaviour; 
layout (location = 4) out vec4 gDepth;
layout (location = 5) out vec4 gMeshID;
layout (location = 6) out vec4 gBaseNormal;
layout (location = 7) out vec4 gVelocity;

 

`,
    wrapper: (body) => `
    
 
void main(){ 
    vec2 a = (currentScreenPosition.xy / currentScreenPosition.w) * 0.5 + 0.5;
    vec2 b = (previousScreenPosition.xy / previousScreenPosition.w) * 0.5 + 0.5;
    vec2 c = a - b;
    gVelocity = vec4(pow(c.x, 3.), pow(c.y, 3.), 0., 1.);
    
    gBaseNormal = vec4(normalVec, 1.);
    gMeshID = vec4(meshID, 1.);
    gDepth = vec4(gl_FragCoord.z, texCoords, 1.);
    gPosition = worldSpacePosition;
    ${body}
  
}
        `,
    inputs: "",
    functions: ""
}


export const vertex = (bodyOperations, inputs, functions) => {
    return `#version 300 es
layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 uvTexture;
layout (location = 3) in vec3 tangentVec;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;


out vec4 worldSpacePosition;
out vec2 texCoords;
out mat3 toTangentSpace;
out vec3 normalVec;

out vec3 viewDirection;
${inputs}
${functions}

void main(){
    worldSpacePosition =  transformMatrix *   vec4(position, 1.0);
    
    vec3 T = normalize( mat3(transformMatrix)  * normalize(tangentVec));
    vec3 N =  normalize(mat3(transformMatrix) * normal);
    vec3 biTangent = cross(N, tangentVec); 
    vec3 B =  normalize(mat3(transformMatrix) * biTangent);
    B = dot(biTangent, B)  > 0. ? -B : B;
    
    toTangentSpace = mat3(T, B, N);
    
    viewDirection = transpose(toTangentSpace) * (worldSpacePosition.xyz - cameraPosition);
    texCoords = uvTexture;
    normalVec = normal;

   
     gl_Position = worldSpacePosition;

    ${bodyOperations}
    
    gl_Position *= projectionMatrix * viewMatrix; 
}
`
}