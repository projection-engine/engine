#version 300 es

precision highp float;
out vec4 fragColor;
in vec2 texCoords;
uniform sampler2D sampler;
const int upSampling = 2;
void main() 
{
    vec2 texelSize = 1.0 / vec2(textureSize(sampler, 0));
    vec3 result = vec3(0.);
    for (int x = -upSampling; x < upSampling; ++x) 
    {
        for (int y = -upSampling; y < upSampling; ++y) 
       {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            result += texture(sampler, texCoords + offset).rgb;
        }
    }
    fragColor = vec4(vec3(result / pow(float(upSampling * 2), 2.)), 1.);
}  
