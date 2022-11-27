
precision highp float;

#define CLAMP_MIN .1
#define CLAMP_MAX .9
#define SEARCH_STEPS 5;
#define DEPTH_THRESHOLD 1.2;
#define PI_SQUARED 6.2831853

//import(cameraUBO)

in vec2 texCoords;
uniform sampler2D previousFrame;
uniform sampler2D depthSampler;
uniform vec4 rayMarchSettings;
out vec4 fragColor;

//import(depthReconstructionUtils)
//import(rayMarcher)

void main(){
    vec4 pixelDepth = texture(depthSampler, texCoords);
    if (pixelDepth.a < 1.) discard;

    vec3 worldNormal = normalFromDepth(pixelDepth.r, texCoords, depthSampler);

    int maxSteps = int(rayMarchSettings.x);
    float falloff = rayMarchSettings.y;
    float minRayStep = rayMarchSettings.z;
    float stepSize = rayMarchSettings.w;

    vec3 viewPos = getViewPosition(texCoords);
    vec3 jitt =vec3(hash(viewPos));


    vec3 normal = normalize(worldNormal).rgb;
    vec3 reflected = normalize(reflect(normalize(viewPos), normal));

    vec3 hitPos = viewPos;
    float dDepth;

    vec4 coords = RayMarch(maxSteps, (reflected * max(minRayStep, -viewPos.z)), hitPos, dDepth, stepSize);

    vec2 dCoords = smoothstep(CLAMP_MIN, CLAMP_MAX, abs(vec2(0.5) - coords.xy));
    float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);
    float reflectionMultiplier =  screenEdgefactor * -reflected.z;
    vec3 tracedAlbedo = texture(previousFrame, coords.xy).rgb;

    fragColor = vec4(tracedAlbedo * clamp(reflectionMultiplier, 0.0, 1.), 1.);
}

