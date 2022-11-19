
precision mediump float;
in vec2 texCoords;

uniform sampler2D iconSampler;
out vec4 finalColor;

void main()
{
    vec4 color = texture(iconSampler, texCoords).rgba;
    if(color.a <= .1)
    discard;
    else
    finalColor = vec4(color);
}