#version 300 es

precision mediump float;

in vec2 texCoords;
uniform sampler2D sceneColor;
uniform vec2 resolution;
const float kernel = 5.;

out vec4 fragColor;

const float weight = 1.;
uniform bool isWidth;

void main( )
{

    vec3 sum = vec3(0);
    float pixelSize = 1.0 / resolution.x;

    // Horizontal Blur
    vec3 accumulation = vec3(0);
    vec3 weightsum = vec3(0);

    vec2 vector;
    for (float i = -kernel; i <= kernel; i++){
        if(isWidth == true)
        vector = vec2(pixelSize * i, 0.);
        else
        vector = vec2(0., pixelSize * i);
        accumulation += texture(sceneColor, texCoords + vector).xyz * weight;
        weightsum += weight;
    }

    sum = accumulation / weightsum;

    fragColor = vec4(sum, 1.0);
}