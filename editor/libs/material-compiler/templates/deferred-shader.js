export default {
    static: `
#version 300 es
precision highp float;
    
#define PI  3.14159265359 
in vec3 normalVec;
in mat4 normalMatrix;
in mat3 toTangentSpace;
in vec3 viewDirection;
in vec2 texCoord;
in vec4 vPosition;
uniform float elapsedTime;
@import(ambientUniforms)

uniform vec3 cameraVec;
layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedo;    // R  G         B
layout (location = 3) out vec4 gBehaviour; // AO ROUGHNESS METALLIC
layout (location = 4) out vec4 gAmbient;

`,
    wrapper: (body, ambient) => `
    
${ambient ? `
@import(fresnelSchlickRoughness)
@import(ambient)
` : ""}
 
void main(){
    gPosition = vPosition;
    ${body}
    
   ${ambient ? `        
        gAmbient = vec4( computeAmbient(cameraVec, gAlbedo.rgb,  vPosition.rgb, gNormal.rgb, gBehaviour.g, gBehaviour.b, ambientLODSamples, brdfSampler, vPosition.rgb), 1.);
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


out vec4 vPosition;
out vec2 texCoord;
out mat3 toTangentSpace;
out vec3 normalVec;

out vec3 viewDirection;
${inputs}
${functions}

void main(){
    vPosition =  transformMatrix *   vec4(position, 1.0);
    
    vec3 T = normalize( mat3(transformMatrix)  * normalize(tangentVec));
    vec3 N =  normalize(mat3(transformMatrix) * normal);
    vec3 biTangent = cross(N, tangentVec); 
    vec3 B =  normalize(mat3(transformMatrix) * biTangent);
    B = dot(biTangent, B)  > 0. ? -B : B;
    
    toTangentSpace = mat3(T, B, N);
    
    viewDirection = transpose(toTangentSpace) * (vPosition.xyz - cameraVec);
    texCoord = uvTexture;
    normalVec = normal;

   
     gl_Position = vPosition;

    ${bodyOperations}
    
    gl_Position *= projectionMatrix * viewMatrix; 
}
`
}