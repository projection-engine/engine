
layout (location = 0) in vec3 position;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out vec3 worldSpacePosition;

void main() {
    worldSpacePosition = position;
    gl_Position = projectionMatrix * viewMatrix * vec4(worldSpacePosition, 1.0);
}