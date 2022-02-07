export const vertex = `#version 300 es

in vec3 position;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 transformMatrix;

void main(){

    gl_Position   =  projectionMatrix * viewMatrix * transformMatrix * vec4(position, 1.0);
}
`

export const fragment = `#version 300 es
precision mediump float;

uniform vec4 color;
out vec4 finalColor;

void main() {
    finalColor = color;
}
`