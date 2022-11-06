#version 300 es

precision mediump float;

out vec4 fragColor;
in vec2 texCoords;

uniform sampler2D blurred;
uniform sampler2D nextSampler;
uniform float bloomIntensity;
uniform float sampleScale;

vec4 upsampleTent(vec2 texelSize)
{
    vec4 d = texelSize.xyxy  * vec4(-1, -1, +1, +1) * (sampleScale * 0.5);

    vec4 s;
    s = texture(blurred, texCoords + d.xy);
    s += texture(blurred, texCoords + d.zy);
    s += texture(blurred, texCoords + d.xw);
    s += texture(blurred, texCoords + d.zw);

    return s * (1.0 / 16.0);
}

void main(void){
    vec2 texelSize = 1.0 / vec2(textureSize(nextSampler, 0));
    fragColor = vec4(vec3(upsampleTent(texelSize) + texture(nextSampler, texCoords)), bloomIntensity);
}