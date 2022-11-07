#version 300 es

precision mediump float;

out vec4 fragColor;
in vec2 texCoords;

uniform sampler2D blurred;
uniform float bloomIntensity;
uniform sampler2D previousSampler;
vec4 upsampleTent(vec2 texelSize)
{
    vec4 d = texelSize.xyxy  * vec4(-1, -1, +1, +1) ;

    vec4 s;
    s = texture(blurred, texCoords + d.xy);
    s += texture(blurred, texCoords + d.zy);
    s += texture(blurred, texCoords + d.xw);
    s += texture(blurred, texCoords + d.zw);

    return s * (1.0 / 16.0);
}

void main(void){
    vec2 texelSize = 1.0 / vec2(textureSize(blurred, 0));
    fragColor = vec4(upsampleTent(texelSize).rgb + texture(previousSampler, texCoords).rgb, bloomIntensity);
}