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

out vec4 worldSpacePosition;
out vec2 texCoords;

void main(){
    worldSpacePosition = transformMatrix *  vec4(position, 1.0);
    texCoords = uvTexture;
    normalVec = normalize(mat3(transformMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix *  worldSpacePosition;
}
