layout (location = 0) in vec3 position;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
out vec4 worldSpacePosition;

void main() {
    worldSpacePosition = transformMatrix * vec4(position , 1.) ;
    gl_Position = projectionMatrix * viewMatrix * worldSpacePosition;
}