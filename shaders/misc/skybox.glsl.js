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


uniform float gamma;
uniform float exposure;
uniform samplerCube uTexture;

out vec4 finalColor;
void main(void){

    vec3 fragment = vec3(1.0) - exp(-texture(uTexture, texCoord).rgb * exposure);
    fragment = pow(fragment, vec3(1.0/gamma));

    finalColor = vec4(fragment, 1.);
}
`