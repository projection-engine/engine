#version 300 es

// IN
layout (location = 1) in vec3 position;
layout (location = 2) in vec3 normal;

// UNIFORM
uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;

uniform mat3 normalMatrix;

// OUT

out vec4 vPosition;
out vec3 normalVec;

void main(){


    vPosition =  transformMatrix *   vec4(position, 1.0);

    normalVec =   normalMatrix * normal;
    normalVec =   normalize(normalVec);

    // END
    gl_Position = projectionMatrix * viewMatrix * vPosition;
}