export const vertex = `

layout (location = 0) in vec3 position;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
out vec4 worldSpacePosition;
 
void main() { 
    worldSpacePosition = transformMatrix * vec4(position , 1.) ;
    gl_Position = projectionMatrix * viewMatrix * worldSpacePosition;
}
`

export const fragment = `
precision highp  float;

void main(void){
}
`

export const omniFragment = `
precision mediump  float;
uniform vec3 lightPosition;
uniform float farPlane;
in vec4 worldSpacePosition;
 
void main(void){
    float fromLightToFrag = length(worldSpacePosition.xyz - lightPosition);
    fromLightToFrag /= farPlane;
    gl_FragDepth = fromLightToFrag;
}
`
