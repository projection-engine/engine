#version 300 es

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 uvTexture;
layout (location = 3) in vec3 tangent;

//import(cameraUBO)

uniform mat4 previousModelMatrix;
uniform mat4 transformMatrix;

out vec3 normalVec;
out vec3 camera;
out vec3 worldSpacePosition;
out vec3 viewSpacePosition;
out vec2 texCoords;
out vec4 previousScreenPosition;
out vec4 currentScreenPosition;
out mat3 toTangentSpace;

void main(){
    vec4 wPosition = transformMatrix * vec4(position, 1.0);
    previousScreenPosition = viewProjection * previousModelMatrix * vec4(position, 1.0);
    currentScreenPosition =  viewProjection * wPosition;

    worldSpacePosition = wPosition.xyz;
    viewSpacePosition = (viewMatrix * wPosition).xyz;

    normalVec = normalize(mat3(transformMatrix) * normal);

    vec3 bitangent = cross(normal, tangent);
    toTangentSpace = mat3(tangent, bitangent, normal);

    camera = placement.xyz;
    texCoords = uvTexture;


    gl_Position = projectionMatrix * viewMatrix * wPosition;
}
