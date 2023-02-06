precision highp float;

#define CLAMP_MIN .1
#define CLAMP_MAX .9
#define SEARCH_STEPS 7
#define DEPTH_THRESHOLD 1.2
#define PI2 6.2831853

//import(cameraViewInfo)

in vec2 texCoords;

uniform sampler2D previousFrame;
uniform vec3 rayMarchSettings;
out vec4 fragColor;

//import(sceneDepthUtils)

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
    float phi = PI2 * randVal.y;

    return tangent * (r * cos(phi)) + bitangent * (r * sin(phi)) + hitNorm.xyz * sqrt(max(0.0, 1. - randVal.x));
}


void main(){

    float pixelDepth = getLogDepth(texCoords);
    if (pixelDepth == 0.) discard;


    float stepSize = rayMarchSettings.x;
    int maxSteps = int(rayMarchSettings.y);
    float intensity = rayMarchSettings.z;

    vec3 viewPos = getViewPosition(texCoords, texCoords);
    vec3 jitt =vec3(hash(viewPos));
    vec3 worldNormal = normalFromDepth(pixelDepth, texCoords);


    vec3 normal = cosHemisphereSample(worldNormal);

    vec3 reflected = normalize(reflect(normalize(viewPos), normal));

    vec3 hitPos = viewPos;

    float step =  stepSize * (clamp(jitt.x, 0., 1.) + clamp(jitt.y, 0., 1.)) + stepSize;
    vec4 coords = RayMarch(maxSteps, normal, hitPos, step, texCoords);

    vec4 tracedAlbedo = texture(previousFrame, coords.xy);

    vec2 dCoords = smoothstep(CLAMP_MIN, CLAMP_MAX, abs(vec2(0.5) - coords.xy));
    float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);
    float reflectionMultiplier = screenEdgefactor * -reflected.z;

    fragColor = vec4(tracedAlbedo.rgb * clamp(reflectionMultiplier, 0.0, 1.) * intensity, 1.);
}

