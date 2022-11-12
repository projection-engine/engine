#version 300 es

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 uvTexture;

uniform CameraMetadata{
    mat4 viewProjection;
    mat4 previousViewProjection;
    vec4 placement;
};

uniform mat4 previousModelMatrix;
uniform mat4 transformMatrix;

out vec3 normalVec;
out vec3 camera;
out vec4 worldSpacePosition;
out vec2 texCoords;
out vec4 previousScreenPosition;
out vec4 currentScreenPosition;

void main(){
    vec4 worldPlacement = vec4(position, 1.0);
    worldSpacePosition = transformMatrix *  worldPlacement;
    previousScreenPosition = viewProjection * previousModelMatrix * worldPlacement;
    currentScreenPosition =  viewProjection * worldSpacePosition;

    camera = placement.xyz;

    texCoords = uvTexture;
    normalVec = normalize(mat3(transformMatrix) * normal);
    gl_Position = currentScreenPosition;
}
