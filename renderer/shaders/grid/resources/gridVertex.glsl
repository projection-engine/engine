#version 300 es

in vec3 position;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

void main(){
    gl_Position   =  (projectionMatrix * (viewMatrix *( vec4(position, 1.0))));
}