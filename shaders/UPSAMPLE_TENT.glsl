

precision mediump float;

out vec4 fragColor;
in vec2 texCoords;

uniform sampler2D blurred;
uniform sampler2D nextSampler;
uniform float sampleScale;

void main(void){
    vec2 texelSize = 1.0 / vec2(textureSize(blurred, 0));
    vec4 d = texelSize.xyxy  * vec4(-1, -1, +1, +1) * (sampleScale * 0.5);

    vec4 s;
    s = texture(blurred, texCoords + d.xy);
    s += texture(blurred, texCoords + d.zy);
    s += texture(blurred, texCoords + d.xw);
    s += texture(blurred, texCoords + d.zw);

    fragColor = vec4(vec3(s * (1.0 / 16.0) + texture(nextSampler, texCoords)), 1.);
}