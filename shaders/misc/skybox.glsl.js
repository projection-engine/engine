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

export const generationFragment = `#version 300 es
precision highp float;
in vec3 vPosition;

uniform sampler2D uSampler;

out vec4 fragColor;

const vec2 invAtan = vec2(0.1591, 0.3183);
vec2 sampleMapTexture(vec3 v){
    vec2 uv = vec2(atan(v.z, v.x), asin(v.y));
    uv *= invAtan;
    uv += 0.5;

    return uv;
}

void main() {
    vec2 uv = sampleMapTexture(normalize(vPosition));
    vec3 color = texture(uSampler, uv.xy).rgb;
    fragColor = vec4(color, 1.0);
}

`