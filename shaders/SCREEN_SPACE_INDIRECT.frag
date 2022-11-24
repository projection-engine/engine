
precision highp float;

#define CLAMP_MIN .1
#define CLAMP_MAX .9
#define SEARCH_STEPS 5;
#define DEPTH_THRESHOLD 1.2;
#define PI_SQUARED 6.2831853
//import(cameraUBO)

in vec2 texCoords;

uniform sampler2D previousFrame;
uniform sampler2D gPosition;
uniform sampler2D gNormal;


uniform vec2 ssgiColorGrading;
uniform mat3 rayMarchSettings;


layout (location = 0) out vec4 SSGISampler;
layout (location = 1) out vec4 SSRSampler;
//vec3 worldNormal;
vec3 viewPos;
vec3 jitt;

//import(rayMarcher)

float interleavedGradientNoise(vec2 n) {
    float f = 0.06711056 * n.x + 0.00583715 * n.y;
    return fract(52.9829189 * fract(f));
}

vec3 cosHemisphereSample(vec3 hitNorm)
{
    vec2 randVal = vec2(interleavedGradientNoise(gl_FragCoord.xy));
    vec3 randomVec  = randVal.rgr;
    vec3 tangent = normalize(randomVec - hitNorm * dot(randomVec, hitNorm));
    vec3 bitangent = cross(hitNorm, tangent);

    float r = sqrt(randVal.x);
    float phi = PI_SQUARED * randVal.y;

    return tangent * (r * cos(phi)) + bitangent * (r * sin(phi)) + hitNorm.xyz * sqrt(max(0.0, 1. - randVal.x));
}


vec3 SSGI(int maxSteps, float stepSize, float intensity){
    vec3 worldNormal = normalize(cosHemisphereSample(vec3(texture(gNormal, texCoords) * invViewMatrix)));

    float gamma = ssgiColorGrading.x;
    float exposure = ssgiColorGrading.y;

    vec3 reflected = normalize(reflect(normalize(viewPos), worldNormal));

    vec3 hitPos = viewPos;
    float dDepth;


    float step =  stepSize * (clamp(jitt.x, 0., 1.) + clamp(jitt.y, 0., 1.)) + stepSize;
    vec4 coords = RayMarch(maxSteps,  worldNormal, hitPos, dDepth, step);
    vec3 tracedAlbedo = texture(previousFrame, coords.xy).rgb;
    tracedAlbedo = vec3(1.0) - exp(-tracedAlbedo * exposure);
    tracedAlbedo = pow(tracedAlbedo, vec3(1.0/gamma));
    vec2 dCoords = smoothstep(CLAMP_MIN, CLAMP_MAX, abs(vec2(0.5) - coords.xy));
    float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);
    float reflectionMultiplier = screenEdgefactor * -reflected.z;

    return tracedAlbedo * clamp(reflectionMultiplier, 0.0, 1.) * intensity;
}

vec3 SSR(int maxSteps, float falloff, float minRayStep, float stepSize){
    vec3 worldNormal = normalize(texture(gNormal, texCoords) * invViewMatrix).rgb;
    vec3 reflected = normalize(reflect(normalize(viewPos), normalize(worldNormal)));

    vec3 hitPos = viewPos;
    float dDepth;

    vec4 coords = RayMarch(maxSteps, (reflected * max(minRayStep, -viewPos.z)), hitPos, dDepth, stepSize);

    vec2 dCoords = smoothstep(CLAMP_MIN, CLAMP_MAX, abs(vec2(0.5) - coords.xy));
    float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);
    float reflectionMultiplier =  screenEdgefactor * -reflected.z;
    vec3 tracedAlbedo = texture(previousFrame, coords.xy).rgb;

    return tracedAlbedo * clamp(reflectionMultiplier, 0.0, 1.);
}



void main(){
    vec4 pixelPosition = texture(gPosition, texCoords);
    if (pixelPosition.a < 1.) discard;
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
    jitt =vec3(hash(viewPos));

    if (ENABLED_SSR)
    SSRSampler = vec4(SSR(SSR_maxSteps, SSR_falloff, SSR_minRayStep, SSR_stepSize), 1.);
    else
    SSRSampler = vec4(vec3(0.), 1.);

    if (ENABLED_SSGI)
    SSGISampler = vec4(SSGI(SSGI_maxSteps, SSGI_stepSize, SSGI_intensity), 1.);
    else
    SSGISampler = vec4(vec3(0.), 1.);
}

