layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 uvTexture;

//import(cameraUBO)

uniform mat4 modelMatrix;

out vec3 normalVec;
out vec3 cameraPosition;
out vec3 worldSpacePosition;

out vec2 texCoords;

void main(){
    vec4 wPosition = modelMatrix * vec4(position, 1.0);
    worldSpacePosition = wPosition.xyz;
    normalVec = normalize(mat3(modelMatrix) * normal);
    cameraPosition = placement.xyz;
    texCoords = uvTexture;
    gl_Position = viewProjection * wPosition;
}
