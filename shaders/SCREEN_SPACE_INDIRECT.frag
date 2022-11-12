#version 300 es
precision highp float;

#define CLAMP_MIN .1
#define CLAMP_MAX .9
#define SEARCH_STEPS 5;
#define DEPTH_THRESHOLD 1.2;

in vec2 texCoords;

uniform sampler2D previousFrame;
uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D gBehaviour;
uniform sampler2D stochasticNormals;

uniform float elapsed;
uniform vec2 ssgiColorGrading;
uniform vec2 noiseScale;
uniform mat3 rayMarchSettings;

uniform mat4 projection;
uniform mat4 viewMatrix;
uniform mat4 invViewMatrix;

layout (location = 0) out vec4 SSGISampler;
layout (location = 1) out vec4 SSRSampler;

vec3 viewPos;

//import(aces)
//import(rayMarcher)


vec3 SSGI(int maxSteps, float stepSize, float intensity, vec2 noiseScale){

    float gamma = ssgiColorGrading.x;
    float exposure = ssgiColorGrading.y;
    vec3 worldNormal = normalize(texture(stochasticNormals, texCoords).rgb);
    vec3 reflected = normalize(reflect(normalize(viewPos), normalize(worldNormal)));

    vec3 hitPos = viewPos;
    float step = stepSize;

    vec4 coords = RayMarch(maxSteps, worldNormal, hitPos, step);
    vec3 tracedAlbedo = texture(previousFrame, coords.xy).rgb;
    tracedAlbedo = vec3(1.0) - exp(-tracedAlbedo * exposure);
    tracedAlbedo = pow(tracedAlbedo, vec3(1.0/gamma));
    vec2 dCoords = smoothstep(CLAMP_MIN, CLAMP_MAX, abs(vec2(0.5) - coords.xy));
    float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);
    float reflectionMultiplier = screenEdgefactor * -reflected.z;

    return tracedAlbedo * clamp(reflectionMultiplier, 0.0, 0.9) * intensity;
}

vec3 SSR(int maxSteps, float falloff, float minRayStep, float stepSize){

    vec3 behaviour = texture(gBehaviour, texCoords).rgb;
    float metallic = behaviour.b;
    float roughness = behaviour.g;

    if (metallic < 0.01)
    return vec3(0.);

    vec3 worldNormal =normalize(texture(gNormal, texCoords) * invViewMatrix).rgb;
    vec3 reflected = normalize(reflect(normalize(viewPos), normalize(worldNormal)));

    vec3 hitPos = viewPos;
    vec3 jitt = mix(vec3(0.0), vec3(hash(viewPos)), roughness);
    vec3 rayDirection = vec3(jitt) + reflected * max(minRayStep, -viewPos.z);
    vec4 coords = RayMarch(maxSteps, rayDirection, hitPos,  stepSize);

    vec2 dCoords = smoothstep(CLAMP_MIN, CLAMP_MAX, abs(vec2(0.5) - coords.xy));
    float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);
    float reflectionMultiplier = pow(metallic, falloff) * screenEdgefactor * -reflected.z;
    vec3 tracedAlbedo = texture(previousFrame, coords.xy).rgb;

    return tracedAlbedo * clamp(reflectionMultiplier, 0.0, 0.9);
}



void main(){
    vec4 pixelPosition = texture(gPosition, texCoords);
    if (pixelPosition.a < 1.)
    discard;
    float SSR_falloff = rayMarchSettings[0][0];
    float SSR_minRayStep = rayMarchSettings[0][1];
    float SSR_stepSize = rayMarchSettings[0][2];
    float SSGI_stepSize = rayMarchSettings[1][0];
    float SSGI_intensity = rayMarchSettings[1][1];
    bool ENABLED_SSGI = rayMarchSettings[1][2] == 1.;
    bool ENABLED_SSR = rayMarchSettings[2][0] == 1.;

    int SSGI_maxSteps = int(rayMarchSettings[2][1]);
    int SSR_maxSteps = int(rayMarchSettings[2][2]);

    viewPos = getViewPosition(texCoords);

    if (ENABLED_SSR)
    SSRSampler = vec4(SSR(SSR_maxSteps, SSR_falloff, SSR_minRayStep, SSR_stepSize), 1.);
    else
    SSRSampler = vec4(vec3(0.), 1.);

    if (ENABLED_SSGI)
    SSGISampler = vec4(SSGI(SSGI_maxSteps, SSGI_stepSize, SSGI_intensity, noiseScale), 1.);
    else
    SSGISampler = vec4(vec3(0.), 1.);
}



