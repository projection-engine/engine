#version 300 es
precision highp float;
#define KERNELS 64
in vec2 texCoords;

uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D noiseSampler;
uniform vec3 samples[KERNELS];
uniform mat4 projection;
uniform vec2 noiseScale;
uniform vec2 settings;// RADIUS, POWER
uniform mat4 invViewMatrix;
out vec4 fragColor;

void main()
{
    float radius = settings.x * 1000.;
    float power = settings.y;

    vec3 fragPos = texture(gPosition, texCoords).xyz;
    vec3 normal = normalize(texture(gNormal, texCoords) * invViewMatrix).rgb;
    vec3 randomVec = normalize(texture(noiseSampler, texCoords * noiseScale).xyz);

    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    float occlusion = 0.0;
    for (int i = 0; i < KERNELS; ++i){
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

    fragColor = vec4(pow(clamp(occlusion, 0., 1.), power), .0, .0, 1.);
}