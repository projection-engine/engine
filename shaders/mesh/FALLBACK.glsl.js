export const vertex = `#version 300 es

layout (location = 1) in vec3 position;
layout (location = 2) in vec3 normal;
layout (location = 3) in vec2 uvTexture;
layout (location = 4) in vec3 tangentVec;

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
    
    normalVec = N; // It was N, Normal matrix 

   
    gl_Position = projectionMatrix * viewMatrix * vPosition;
}
`

export const fragment = `#version 300 es
precision highp float;

in vec4 vPosition;
in vec3 normalVec;
in mat3 toTangentSpace;
 
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

    gAlbedo = vec4(.5, .5, .5, 1.);
    gBehaviour = vec4(1.,1.,0.,1.);
    gNormal = vec4(normalize(toTangentSpace * ((vec3(.5, .5, 1.) * 2.0)- 1.0)), 1.0);
    
    vec3 diffuse = vec3(0.);
    vec3 specular = vec3(0.);
   

    gAmbient = vec4( computeAmbient(cameraVec, gAlbedo.rgb,  vPosition.rgb, gNormal.rgb, gBehaviour.g, gBehaviour.b, ambientLODSamples, brdfSampler, vPosition.rgb), 1.);

}
`
 export const cubeMapShader = `#version 300 es
precision lowp float;

out vec4 finalColor;

void main(){  
  finalColor = vec4(1.);
}
 `