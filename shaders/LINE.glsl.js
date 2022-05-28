export const vertex = `#version 300 es

// IN
layout (location = 1) in vec3 position;
// layout (location = 1) in mat4 transformation;

// UNIFORM
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 transformMatrix;


void main(){
    gl_Position = projectionMatrix * viewMatrix * transformMatrix * vec4(position, 1.0);
}
`

export const fragment = `#version 300 es

precision mediump float;
out vec4 fragColor;
void main(){
    fragColor = vec4(1.);
}
`

