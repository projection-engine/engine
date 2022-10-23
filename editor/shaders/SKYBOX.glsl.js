export const vertex = `#version 300 es
layout (location = 0) in vec3 position;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
out vec3 uv;


void main(){
    mat4 m = viewMatrix ;
	   m[3][0]  = 0.0;
	   m[3][1]  = 0.0;
	   m[3][2]  = 0.0;
    uv = position;
    gl_Position = projectionMatrix * m * vec4(position, 1.0);
}
`
export const fragment = `#version 300 es
precision mediump float;

in vec3 uv;
out vec4 finalColor;
uniform float gamma;
uniform vec3 color;

void main(void){
    finalColor = vec4(vec3(pow(color.r, gamma), pow(color.g, gamma),pow(color.b, gamma)), 1.);
}
`

export const debug = `#version 300 es
precision mediump float;

in vec3 uv;
uniform samplerCube debugSampler;
out vec4 finalColor;
 

void main(void){
    vec3 c = vec3(texture(debugSampler, uv).r); 
    finalColor = vec4(c, 1.);
}
`
