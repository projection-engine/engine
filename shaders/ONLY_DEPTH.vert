

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 uvTexture;

//import(cameraUBO)

uniform mat4 previousModelMatrix;
uniform mat4 transformMatrix;

out vec3 normalVec;
out vec2 texCoords;
out vec4 previousScreenPosition;
out vec4 currentScreenPosition;

void main(){
    vec4 worldPlacement = vec4(position, 1.0);
    vec4 worldSpacePosition = transformMatrix *  worldPlacement;
    previousScreenPosition = viewProjection * previousModelMatrix * worldPlacement;
    currentScreenPosition =  viewProjection * worldSpacePosition;

    texCoords = uvTexture;
    normalVec = normalize(mat3(transformMatrix) * normal);
    gl_Position = currentScreenPosition;
}

