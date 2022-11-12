#version 300 es
layout (location = 0) in vec3 position;

uniform CameraMetadata{
    mat4 viewProjection;
    mat4 previousViewProjection;
};

out vec3 worldSpacePosition;

void main() {
    worldSpacePosition = position;
    gl_Position = viewProjection * vec4(worldSpacePosition, 1.0);
}
