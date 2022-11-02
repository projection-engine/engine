#version 300 es
precision highp float;
#define KERNELS 64

uniform CameraMetadata{
    mat4 viewMatrix;
    mat4 projectionMatrix;
};
uniform Settings{
    vec4 settings;
    vec4 samples[KERNELS];
    vec2 noiseScale;
};
in vec2 texCoords;
uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D noiseSampler;
out vec4 fragColor;

void main()
{
    vec3 fragPosition = texture(gPosition, texCoords).rgb;
    if (fragPosition.x == 0.0 && fragPosition.y == 0.0 && fragPosition.z == 0.0)
        discard;

    float radius = settings.x;
    float power = settings.y;
    float bias = settings.z;

    vec3 normal = normalize(texture(gNormal, texCoords).rgb);
    vec3 randomVec = normalize(texture(noiseSampler, texCoords * noiseScale).xyz);

    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    float occlusion = 0.0;
    for (int i = 0; i < KERNELS; ++i){
        vec3 samplePos = TBN * samples[i].rgb;
        samplePos = fragPosition + samplePos * radius;
        vec4 offset = vec4(samplePos, 1.0);
        offset = projectionMatrix * viewMatrix *offset;
        offset.xyz /= offset.w;
        offset.xyz = offset.xyz * 0.5 + 0.5;
        float sampleDepth = texture(gPosition, offset.xy).z;
        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(fragPosition.z - sampleDepth));
        occlusion += (sampleDepth >= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;
    }
    occlusion = occlusion / float(KERNELS);

    fragColor = vec4(pow(clamp(occlusion, 0., 1.), power), .0, .0, 1.);
}