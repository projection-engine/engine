#version 300 es

precision mediump float;
in vec2 texCoord;

uniform sampler2D iconSampler;
out vec4 finalColor;

void main()
{
    vec3 color = texture(iconSampler, texCoord).rgb;
    if(color.r < 0.5 && color.g < 0.5 && color.b < 0.5)
        discard;
    else
        finalColor = vec4(color, 1.0);
}