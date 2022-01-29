#version 300 es
in vec3 position;

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;

out vec3 vPosition;
void main() {
    vPosition = position;

    gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
}
