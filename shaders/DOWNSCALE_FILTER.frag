#version 300 es

precision mediump float;

out vec4 fragColor;
in vec2 texCoords;

uniform sampler2D sampler;
uniform float downscaleStrength;


void main(void){
    vec2 pixelOffset =  1./ vec2(textureSize(sampler, 0));


    vec3 downScaleColor = texture(sampler, vec2(texCoords.x - downscaleStrength * pixelOffset.x, texCoords.y)).xyz;
    downScaleColor += texture(sampler, vec2(texCoords.x + downscaleStrength * pixelOffset.x, texCoords.y)).xyz;
    downScaleColor += texture(sampler, vec2(texCoords.x, texCoords.y - downscaleStrength * pixelOffset.y)).xyz;
    downScaleColor += texture(sampler, vec2(texCoords.x, texCoords.y + downscaleStrength * pixelOffset.y)).xyz;

    downScaleColor *= .25;

    fragColor = vec4(downScaleColor, 1.);

}