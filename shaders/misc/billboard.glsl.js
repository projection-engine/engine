export const fragment = `#version 300 es

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
        finalColor = vec4(color, .75);
}
`

export const vertex = `#version 300 es

// IN
layout (location = 0) in vec3 position;
layout (location = 1) in mat4 transformation;

// UNIFORM
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
 


out vec2 texCoord;

void main(){
    texCoord = (position.xy) * 0.5 + 0.5;
    mat4 m =  viewMatrix * transformation;

    float d = .75; // BILLBOARD SIZE

    m[0][0]  = d;
    m[0][1]  = 0.0;
    m[0][2]  = 0.0;
    m[0][3]  = 0.0;

    m[1][0] = 0.0;
    m[1][1] =d;
    m[1][2] =0.0;
    m[1][3]  = 0.0;

    m[2][0] = 0.0;
    m[2][1] = 0.0;
    m[2][2] = d;
    m[2][3]  = 0.0;


    vec4 transformed =projectionMatrix * m * vec4(position, 1.0);
    transformed /= transformed.w;

    gl_Position = vec4(transformed.xyz, 1.0);
}

`