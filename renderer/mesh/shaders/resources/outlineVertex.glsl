#version 300 es

layout (location = 1) in vec3 position;
layout (location = 2) in vec3 normal;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;

out vec4 vertexPosition;


void main(){
    vertexPosition = vec4(position + normal * 0.1, 1.0);
    vec4 transformed = transformMatrix * vertexPosition ;
    vertexPosition = projectionMatrix * viewMatrix * transformed;

    gl_Position = vertexPosition;
}