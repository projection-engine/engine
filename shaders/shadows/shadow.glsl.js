export const vertex = `#version 300 es

layout (location = 1) in vec3 position;

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
precision mediump  float;

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
   
    float lightFragDist =(length(fromLightToFrag) - shadowClipNearFar.x)/(shadowClipNearFar.y - shadowClipNearFar.x);

    gl_FragDepth = lightFragDist;
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