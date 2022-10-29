#version 300 es

// THANKS TO https://imanolfotia.com/blog/1
precision highp float;

uniform mat4 invViewMatrix;

uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D gBehaviour;
const float falloff = 3.0;
const float minRayStep = 0.1;

in vec2 texCoords;

#define CLAMP_MIN .1
#define CLAMP_MAX .9

uniform float stepSize;

//import(rayMarcher)

void main(){

    vec3 behaviour = texture(gBehaviour, texCoords).rgb;
    Metallic = behaviour.b;
    float roughness = behaviour.g;

    if(Metallic < 0.01)
    discard;

    vec3 worldNormal =normalize(texture(gNormal, texCoords) * invViewMatrix).rgb;
    vec3 viewPos = getViewPosition(texCoords);
    vec3 reflected = normalize(reflect(normalize(viewPos), normalize(worldNormal)));

    vec3 hitPos = viewPos;
    float dDepth;
    vec3 jitt = mix(vec3(0.0), vec3(hash(viewPos)), roughness);
    vec4 coords = RayMarch((vec3(jitt) + reflected * max(minRayStep, -viewPos.z)), hitPos, dDepth, stepSize);

    vec2 dCoords = smoothstep(CLAMP_MIN, CLAMP_MAX, abs(vec2(0.5) - coords.xy));
    float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);
    float ReflectionMultiplier = pow(Metallic, falloff) * screenEdgefactor * -reflected.z;
    vec3 tracedAlbedo = texture(previousFrame, coords.xy).rgb;

    outColor = vec4(tracedAlbedo * clamp(ReflectionMultiplier, 0.0, 0.9) , 1.);
}



