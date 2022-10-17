export const vertex = `#version 300 es
layout (location = 0) in vec3 position;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;



void main(){
    mat4 m = viewMatrix ;
	   m[3][0]  = 0.0;
	   m[3][1]  = 0.0;
	   m[3][2]  = 0.0;

    gl_Position = projectionMatrix * m * vec4(position, 1.0);
}
`
export const fragment = `#version 300 es
precision mediump float;

out vec4 finalColor;
uniform float gamma;
uniform vec3 color;

void main(void){
    finalColor = vec4(vec3(pow(color.r, gamma),pow(color.g, gamma),pow(color.b, gamma)), 1.);
}
`
