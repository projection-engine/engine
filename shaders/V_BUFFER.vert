layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 uv;

//import(cameraUBO)

uniform mat4 transformationMatrix;
out vec3 normalVec;
out vec4 viewSpacePosition;
out vec2 texCoords;

void main(){
    texCoords = uv;
    normalVec = normalize(mat3(transformationMatrix) * normal);
    viewSpacePosition = viewMatrix * transformationMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewSpacePosition;
}
