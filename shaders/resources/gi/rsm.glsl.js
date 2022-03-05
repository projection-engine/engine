export const vertex = `#version 300 es

layout (location = 1) in vec3 position;
layout (location = 2) in vec3 normal;
layout (location = 3) in vec2 uvTexture;
layout (location = 4) in vec3 tangentVec;
  
uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;

out vec3 vPosition;
out vec3 vWorldSpacePosition;
out mat3 toTangentSpace;
out vec2 texCoord;

void main() {
    texCoord = uvTexture;
    vec4 worldSpacePos = transformMatrix * vec4(position , 1.);
    vec4 p = projectionMatrix * viewMatrix * worldSpacePos;
    
    vec3 T = normalize(vec3(transformMatrix * vec4(normalize(tangentVec), .0)));
    vec3 N =  normalize(vec3(transformMatrix * vec4(normal, .0)));
    vec3 biTangent = cross(N, tangentVec); 
    vec3 B =  normalize(vec3(transformMatrix * vec4(biTangent, .0)));
    B = dot(biTangent, B)  > 0. ? -B : B;
    
    toTangentSpace = mat3(T, B, N);
    
   
    vPosition = p.xyz / p.w ;
    
    
    vWorldSpacePosition = worldSpacePos.xyz;
    
    
    gl_Position = p;
}
`

export const fragment = `#version 300 es
precision mediump  float;

in vec3 vPosition;
in vec3 vWorldSpacePosition;
in vec2 texCoord;
in mat3 toTangentSpace;

uniform vec3 lightColor;
uniform sampler2D albedoSampler;
uniform sampler2D normalSampler;

layout (location = 0) out vec4 rsmNormal;
layout (location = 1) out vec4 rsmFlux;
layout (location = 2) out vec4 rsmWorld;


void main(void){
 
      
    rsmNormal =  vec4(normalize(toTangentSpace * ((texture(normalSampler, texCoord).xyz * 2.0)- 1.0)), 1.0);
    rsmFlux = vec4((lightColor * texture(albedoSampler, texCoord).rgb), 1.0);
    rsmWorld = vec4(vec3(vWorldSpacePosition.xyz), 1.0);
}
`

