#version 300 es
layout (location = 0) in vec3 position;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;

out vec3 worldSpacePosition;
void main() {
    worldSpacePosition = position;

    gl_Position = projectionMatrix * viewMatrix * vec4(worldSpacePosition, 1.0);
}
