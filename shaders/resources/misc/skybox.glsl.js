export const vertex = `#version 300 es
layout (location = 0) in vec3 position;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out highp vec3 texCoord;


void main(){
    texCoord = position;
    gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
}
`
export const fragment = `#version 300 es

precision mediump float;

in highp vec3 texCoord;
uniform samplerCube uTexture;

out vec4 finalColor;
void main(void){
    finalColor = texture(uTexture, texCoord);
}
`