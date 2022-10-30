export default {
    static: `
#version 300 es
precision highp float;
    
#define PI  3.14159265359 
in vec3 normalVec;
in mat4 normalMatrix;
in mat3 toTangentSpace;
in vec3 viewDirection;
in vec2 texCoords;
in vec3 meshID;
in vec4 worldSpacePosition;
uniform float elapsedTime;
//import(ambientUniforms)

uniform vec3 cameraVec;
layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedo;    // R  G         B
layout (location = 3) out vec4 gBehaviour; // AO ROUGHNESS METALLIC
layout (location = 4) out vec4 gAmbient;


layout (location = 5) out vec4 gDepth;
layout (location = 6) out vec4 gMeshID;
layout (location = 7) out vec4 gBaseNormal;
 

`,
    wrapper: (body, ambient) => `
    
${ambient ? `
//import(fresnelSchlickRoughness)
//import(ambient)
` : ""}
 
void main(){ 
    gBaseNormal = vec4(normalVec, 1.);
    gMeshID = vec4(meshID, 1.);
    gDepth = vec4(gl_FragCoord.z, texCoords, 1.);
    gPosition = worldSpacePosition;
    ${body}
    
   ${ambient ? `        
        gAmbient = vec4( computeAmbient(cameraVec, gAlbedo.rgb,  worldSpacePosition.rgb, gNormal.rgb, gBehaviour.g, gBehaviour.b, ambientLODSamples, brdfSampler, worldSpacePosition.rgb), 1.);
    ` : "gAmbient = vec4(vec3(0.), 1.);"}
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
uniform vec3 cameraVec;


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
    
    viewDirection = transpose(toTangentSpace) * (worldSpacePosition.xyz - cameraVec);
    texCoords = uvTexture;
    normalVec = normal;

   
     gl_Position = worldSpacePosition;

    ${bodyOperations}
    
    gl_Position *= projectionMatrix * viewMatrix; 
}
`
}