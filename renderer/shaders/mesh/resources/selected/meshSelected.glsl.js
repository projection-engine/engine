export const vertex = `#version 300 es
precision highp float;

// IN
in vec4 vPosition;
in vec3 normalVec;

uniform vec3 cameraVec;
// OUTPUTS
out vec4 fragColor;



void main(){
    float shadingIntensity = dot( normalize(normalVec), vec3(0.0, 1.0, 0.0));
    float brightness = max(0.2, shadingIntensity);
    vec3 color = vec3(1.0, 1.0, 0.0) * brightness;
    fragColor = vec4(color, 0.7);
}
`

export const fragment = `#version 300 es

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
`