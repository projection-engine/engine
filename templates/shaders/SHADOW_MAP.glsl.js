export const vertex = `#version 300 es

layout (location = 0) in vec3 position;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
out vec4 vPosition;
 
void main() { 
    vPosition = transformMatrix * vec4(position , 1.) ;
    gl_Position = projectionMatrix * viewMatrix * vPosition;
}
`

export const fragment = `#version 300 es
precision highp  float;

void main(void){
}
`

export const omniFragment = `#version 300 es
precision mediump  float;
uniform vec3 lightPosition;
uniform vec2 shadowClipNearFar;
in vec4 vPosition;
 
void main(void){
    vec3 fromLightToFrag = (vPosition.xyz - lightPosition);
   
    float lightFragDist = (length(fromLightToFrag) - shadowClipNearFar.x)/(shadowClipNearFar.y - shadowClipNearFar.x);
    gl_FragDepth = lightFragDist;
}
`