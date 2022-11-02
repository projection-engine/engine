#version 300 es

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 uvTexture;

uniform CameraMetadata{
    mat4 viewMatrix;
    mat4 projectionMatrix;
    vec3 placement;
};

uniform mat4 transformMatrix;
out vec3 normalVec;
out vec3 camera;
out vec4 worldSpacePosition;
out vec2 texCoords;

void main(){
    camera = placement;
    worldSpacePosition = transformMatrix *  vec4(position, 1.0);
    texCoords = uvTexture;
    normalVec = normalize(mat3(transformMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix *  worldSpacePosition;
}
