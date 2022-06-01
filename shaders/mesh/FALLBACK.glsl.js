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
    
    normalVec = N; 

   
    gl_Position = projectionMatrix * viewMatrix * vPosition;
}
`
export const fragmentForward = `#version 300 es
  
precision highp float;

#define PI  3.14159265359 

in vec4 vPosition;
uniform vec3 cameraVec;
in vec3 normalVec;
@import(ambientUniforms)

out vec4 finalColor;

@import(fresnelSchlickRoughness)
@import(forwardAmbient)

@import(fresnelSchlick)
@import(geometrySchlickGGX)
@import(distributionGGX)
@import(geometrySmith)

void main(){

    vec3 fragPosition = vPosition.xyz;  
    vec3 albedo = vec3(1.);
           
    float roughness = .5;
    float metallic = .5;
    vec3 N = normalVec; 
    
    
    vec3 V = normalize(cameraVec - fragPosition);
    float NdotV    = max(dot(N, V), 0.000001);
    vec3 F0 = vec3(0.04);
    vec3 Lo = vec3(0.0);
    F0 = mix(F0, albedo, metallic);
    Lo += computeAmbient(NdotV, metallic, roughness, albedo, F0, V, N, ambientLODSamples, brdfSampler, vPosition.rgb);
    finalColor = vec4(Lo , 1.);

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

out vec4 finalColor;

void main(){  
  finalColor = vec4(vec3(.5), 1.);
}
 `