export const vertex = `#version 300 es

in vec3 aPos;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out highp vec3 texCoord;


void main(){
    texCoord = aPos;
    gl_Position = projectionMatrix * viewMatrix * vec4(aPos, 1.0);
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