export const vertex = `#version 300 es

layout (location = 1) in vec3 position;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;

 
void main() { 
    gl_Position = projectionMatrix * viewMatrix * transformMatrix * vec4(position , 1.);
}
`

export const fragment = `#version 300 es
precision mediump  float;

void main(void){
 
}
`




export const debugVertex = `#version 300 es

in vec3 position;
out vec2 texCoord;

void main() {
    texCoord = (position.xy) * 0.5 + 0.5;
    gl_Position = vec4(position, 1.0);
}

`
export const debugFragment = `#version 300 es
precision highp float;

in vec2 texCoord;

uniform sampler2D uSampler;

out vec4 fragColor;

void main(void){
    
    fragColor = vec4(texture(uSampler, texCoord).rgb, 1.);
}
`