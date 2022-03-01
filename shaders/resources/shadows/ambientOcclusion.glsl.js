export const vertex = `#version 300 es

in vec3 position;
out vec2 texCoord;

void main()
{
    texCoord = (position.xy) * 0.5 + 0.5;
    gl_Position = vec4(position, 1);
}
`
export const fragment = `#version 300 es

precision highp float;

out float fragColor;

in vec2 texCoords;

uniform sampler2D positionSampler;
uniform sampler2D normalSampler;
uniform sampler2D noiseSampler;

uniform vec3 samples[64];


int kernelSize = 64;
float radius = 0.5;
float bias = 0.025;

// tile noise texture over screen based on screen dimensions divided by noise size
const vec2 noiseScale = vec2(1920.0/4.0, 1080.0/4.0); 

uniform mat4 projectionMatrix;

void main()
{
    vec3 fragPos = texture(positionSampler, texCoords).xyz;
    vec3 normal = normalize(texture(normalSampler, texCoords).rgb);
    vec3 randomVec = normalize(texture(noiseSampler, texCoords * noiseScale).xyz);
    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);
    float occlusion = 0.0;
    
    for(int i = 0; i < kernelSize; ++i)
    {
        vec3 samplePos = TBN * samples[i];
        samplePos = fragPos + samplePos * radius; 
       
        vec4 offset = vec4(samplePos, 1.0);
        offset = projectionMatrix * offset;
        offset.xyz /= offset.w; 
        offset.xyz = offset.xyz * 0.5 + 0.5;
        
        float sampleDepth = texture(positionSampler, offset.xy).z;
        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(fragPos.z - sampleDepth));
        
        occlusion += (sampleDepth >= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;           
    }
    occlusion = 1.0 - (occlusion / float(kernelSize));
    
    fragColor = 1.;
}
`


export const fragmentBlur = `#version 300 es

precision highp float;
out float fragColor;

in vec2 texCoords;

uniform sampler2D aoSampler;

void main() 
{
    vec2 texelSize = 1.0 / vec2(textureSize(aoSampler, 0));
    float result = 0.0;
    for (int x = -2; x < 2; ++x) 
    {
        for (int y = -2; y < 2; ++y) 
        {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            result += texture(aoSampler, texCoords + offset).r;
        }
    }
    fragColor = result / (4.0 * 4.0);
}  

`
