#version 300 es

layout (location = 1) in vec3 position;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;


void main() {
    vec4 transformed =  transformMatrix *  vec4(position, 1.0) ;
    gl_Position= projectionMatrix * viewMatrix * transformed;
}
