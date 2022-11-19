

precision highp float;
out vec4 fragColor;
in vec2 texCoords;
uniform sampler2D sampler;
uniform int samples;

void main() 
{
    vec2 texelSize = 1.0 / vec2(textureSize(sampler, 0));
    float result = 0.;
    for (int x = -samples; x < samples; ++x)
    {
        for (int y = -samples; y < samples; ++y)
       {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            result += texture(sampler, texCoords + offset).r;
        }
    }
    fragColor = vec4(vec3(result / pow(float(samples * 2) , 2.)), 1.);
}  
