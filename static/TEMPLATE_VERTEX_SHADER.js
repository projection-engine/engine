export default  `#version 300 es

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