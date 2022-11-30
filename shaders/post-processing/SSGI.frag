precision mediump float;

#define CLAMP_MIN .1
#define CLAMP_MAX .9
#define SEARCH_STEPS 5;
#define DEPTH_THRESHOLD 1.2;
#define PI_SQUARED 6.2831853
//import(cameraUBO)

in vec2 texCoords;

uniform sampler2D previousFrame;
uniform sampler2D scene_depth;
uniform vec2 ssgiColorGrading;
uniform vec3 rayMarchSettings;
out vec4 fragColor;

vec2 quadUV;
//import(depthReconstructionUtils)

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

void main(){

    vec4 pixelDepth = texture(scene_depth, texCoords);
    if (pixelDepth.a < 1.) discard;
    quadUV = texCoords;

    float stepSize = rayMarchSettings.x;
    int maxSteps = int(rayMarchSettings.y);
    float intensity = rayMarchSettings.z;

    vec3 viewPos = getViewPosition(texCoords);
    vec3 jitt =vec3(hash(viewPos));
    vec3 worldNormal = normalFromDepth(pixelDepth.r, texCoords, scene_depth);


    vec3 normal = cosHemisphereSample(worldNormal);
    float gamma = ssgiColorGrading.x;
    float exposure = ssgiColorGrading.y;
    vec3 reflected = normalize(reflect(normalize(viewPos), normal));
    vec3 hitPos = viewPos;
    float dDepth;
    float step =  stepSize * (clamp(jitt.x, 0., 1.) + clamp(jitt.y, 0., 1.)) + stepSize;
    vec4 coords = RayMarch(maxSteps,  normal, hitPos, dDepth, step);
    vec3 tracedAlbedo = texture(previousFrame, coords.xy).rgb;
    tracedAlbedo = vec3(1.0) - exp(-tracedAlbedo * exposure);
    tracedAlbedo = pow(tracedAlbedo, vec3(1.0/gamma));

    vec2 dCoords = smoothstep(CLAMP_MIN, CLAMP_MAX, abs(vec2(0.5) - coords.xy));
    float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);
    float reflectionMultiplier = screenEdgefactor * -reflected.z;

    fragColor = vec4(tracedAlbedo * clamp(reflectionMultiplier, 0.0, 1.) * intensity, 1.);
}

