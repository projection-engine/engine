export const vertex = `#version 300 es

layout (location = 0) in vec3 Position;

out vec2 texCoords;

void main()
{
    gl_Position = vec4(Position, 1.0);
    texCoords = Position.xy * 0.5 + 0.5;
}
`

export const fragment = `#version 300 es

precision highp float;

#define KERNELS 64

in vec2 texCoords;

uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D noiseSampler;
uniform vec3 samples[KERNELS];
uniform mat4 projection;
uniform vec2 noiseScale;

// parameters (you'd probably want to use them as uniforms to more easily tweak the effect)
int kernelSize = 64;
float radius = 100.; 

// tile noise texture over screen based on screen dimensions divided by noise size
 
out vec4 fragColor;

void main()
{
    // get input for SSAO algorithm
    vec3 fragPos = texture(gPosition, texCoords).xyz;
    vec3 normal = normalize(texture(gNormal, texCoords).rgb);
    vec3 randomVec = normalize(texture(noiseSampler, texCoords * noiseScale).xyz);
    
    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);
    
    float occlusion = 0.0;
    for(int i = 0; i < kernelSize; ++i){
        vec3 samplePos = TBN * samples[i];
        samplePos = fragPos + samplePos * radius;
        vec4 offset = vec4(samplePos, 1.0);
        offset = projection * offset; 
        offset.xyz /= offset.w; 
        offset.xyz = offset.xyz * 0.5 + 0.5;
        float sampleDepth = texture(gPosition, offset.xy).z; 
        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(fragPos.z - sampleDepth));
        occlusion += (sampleDepth >= samplePos.z  ? 1.0 : 0.0) * rangeCheck;           
    }
    occlusion = 1.0 - (occlusion / float(KERNELS));
    
    fragColor = vec4(pow(clamp(occlusion, 0., 2.), 3.),.0,.0, 1.);
}
`
export const fragmentBlur = `#version 300 es

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

`
