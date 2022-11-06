#version 300 es

precision highp float;

out vec4 fragColor;

in vec2 blurTextureCoords[11];

uniform sampler2D sceneColor;

void main(void){

    fragColor = vec4(0.0);
    fragColor += texture(sceneColor, blurTextureCoords[0]) * 0.0093;
    fragColor += texture(sceneColor, blurTextureCoords[1]) * 0.028002;
    fragColor += texture(sceneColor, blurTextureCoords[2]) * 0.065984;
    fragColor += texture(sceneColor, blurTextureCoords[3]) * 0.121703;
    fragColor += texture(sceneColor, blurTextureCoords[4]) * 0.175713;
    fragColor += texture(sceneColor, blurTextureCoords[5]) * 0.198596;
    fragColor += texture(sceneColor, blurTextureCoords[6]) * 0.175713;
    fragColor += texture(sceneColor, blurTextureCoords[7]) * 0.121703;
    fragColor += texture(sceneColor, blurTextureCoords[8]) * 0.065984;
    fragColor += texture(sceneColor, blurTextureCoords[9]) * 0.028002;
    fragColor += texture(sceneColor, blurTextureCoords[10]) * 0.0093;

}