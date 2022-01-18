#version 300 es

// IN
in vec3 position;

// UNIFORM
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 transformationMatrix;

void main(){
    vec4 transformed = vec4(position, 1.0) * transformationMatrix;
    gl_Position = projectionMatrix * viewMatrix *  transformed;
}