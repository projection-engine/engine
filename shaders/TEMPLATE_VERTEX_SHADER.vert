#version 300 es

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

out vec4 worldSpacePosition;
out vec2 texCoords;

out mat3 toTangentSpace;
out vec3 viewDirection;


void main(){
    worldSpacePosition = transformMatrix *  vec4(position, 1.0);

    mat3 tMatrix = mat3(transformMatrix);


    vec3 T = normalize(vec3(transformMatrix * vec4(tangentVec, 0.0)));
    vec3 N = normalize(vec3(transformMatrix * vec4(normal, 0.0)));

    T = normalize(T - dot(T, N) * N);
    vec3 B = cross(N, T);

    toTangentSpace = mat3(T, B, N);
    bitangent = B;
    tangent = T;


    mat3 t = transpose(toTangentSpace);
    viewDirection = normalize(t * cameraVec  - t * worldSpacePosition.xyz);
    texCoords = uvTexture;

    normalVec = N;
    gl_Position = projectionMatrix * viewMatrix *  worldSpacePosition;
}
