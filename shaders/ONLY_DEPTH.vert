layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;

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
//out mat3 toTangentSpace;

void main(){
    worldSpacePosition = vec3(0.);
    viewSpacePosition = vec3(0.);
    camera = vec3(0.);
    texCoords = vec2(0.);

    vec4 wPosition = transformMatrix * vec4(position, 1.0);
    previousScreenPosition = viewProjection * previousModelMatrix * vec4(position, 1.0);
    currentScreenPosition = viewProjection * wPosition;
    normalVec = normalize(mat3(transformMatrix) * normal);

    gl_Position = projectionMatrix * viewMatrix * wPosition;
}
