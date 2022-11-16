#version 300 es
layout (location = 0) in vec3 position;

//import(cameraUBO)

out vec3 worldSpacePosition;

void main() {
    worldSpacePosition = position;
    gl_Position = viewProjection * vec4(worldSpacePosition, 1.0);
}
