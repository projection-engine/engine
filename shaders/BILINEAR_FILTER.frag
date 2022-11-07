#version 300 es
precision mediump float;

out vec4 fragColor;
in vec2 texCoords;

uniform sampler2D sampler;
uniform float downscaleStrength;



void main(void){
    vec2 res =  vec2(textureSize(sampler, 0))/4.;
    vec2 st = texCoords * res - 0.5;

    vec2 iuv = floor( st );
    vec2 fuv = fract( st );

    vec4 a = texture( sampler, (iuv+vec2(0.5,0.5))/res );
    vec4 b = texture( sampler, (iuv+vec2(1.5,0.5))/res );
    vec4 c = texture( sampler, (iuv+vec2(0.5,1.5))/res );
    vec4 d = texture( sampler, (iuv+vec2(1.5,1.5))/res );

    fragColor = mix(
        mix( a, b, fuv.x),
        mix( c, d, fuv.x), fuv.y
    );


}