precision highp float;
#define KERNELS 64

//import(cameraUBO)

uniform Settings{
    vec4 settings;
    vec4 samples[KERNELS];
    vec2 noiseScale;
};
in vec2 texCoords;
uniform int maxSamples;
uniform sampler2D gDepth;
uniform sampler2D noiseSampler;
out vec4 fragColor;

//import(depthReconstructionUtils)

void main() {
    vec4 depthData = texture(gDepth, texCoords);
    if (depthData.a < 1.) discard;

    vec3 viewSpacePosition = viewSpacePositionFromDepth(depthData.r, texCoords);
    vec3 worldSpacePosition = vec3(invViewMatrix * vec4(viewSpacePosition, 1.));
    float distanceFromCamera = length(placement.xyz - worldSpacePosition);

    float radius = settings.x;
    float power = settings.y;
    float bias = settings.z;
    float distanceFalloff = settings.w;
    float occlusion = 0.0;
    float attenuation = clamp(mix(1., 0., distanceFalloff - distanceFromCamera), 0., 1.);

    if (attenuation < 1.){
        vec3 normal = normalFromDepth(depthData.r, texCoords, gDepth);
        vec3 randomVec = texture(noiseSampler, texCoords * noiseScale).xyx;
        vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
        vec3 bitangent = cross(normal, tangent);
        mat3 TBN = mat3(tangent, bitangent, normal);


        for (int i = 0; i < maxSamples; ++i){
            vec3 samplePos = TBN * samples[i].rgb;
            samplePos = viewSpacePosition.xyz + samplePos * radius;
            vec4 offset = vec4(samplePos, 1.0);
            offset = projectionMatrix * offset;
            offset.xyz /= offset.w;
            offset.xyz = offset.xyz * 0.5 + 0.5;
            float sampleDepth = viewSpacePositionFromDepth(texture(gDepth, offset.xy).r, texCoords).z;
            float rangeCheck = smoothstep(0.0, 1.0, radius / abs(viewSpacePosition.z - sampleDepth));
            occlusion += (sampleDepth >= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;
        }
    }
    occlusion = 1.- occlusion / float(maxSamples);
    fragColor = vec4(pow(clamp(occlusion, 0., 1.), power), .0, .0, 1.);

}