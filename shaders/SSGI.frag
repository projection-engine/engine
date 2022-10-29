#version 300 es
precision highp float;

uniform sampler2D gPosition;
uniform sampler2D gNormal;

uniform vec2 settings; // stepSize,  intensity
uniform vec2 noiseScale;
uniform sampler2D noiseSampler;
uniform mat4 invViewMatrix;
in vec2 texCoords;

//import(rayMarcher)

//import(aces)



void main(){

    vec3 worldNormal = normalize(texture(gNormal, texCoords).rgb);
    vec3 viewPos = getViewPosition(texCoords);


    vec3 hitPos = viewPos;
    float dDepth;
    vec2 jitter = texture(noiseSampler, texCoords * noiseScale).rg;
    jitter.x = clamp(jitter.x, 0., 1.);
    jitter.y = clamp(jitter.y, 0., 1.);

    float stepSize = settings.x * (jitter.x + jitter.y) + settings.x;

    vec4 coords = RayMarch(worldNormal, hitPos, dDepth, stepSize);

    vec3 tracedAlbedo = aces(texture(previousFrame, coords.xy).rgb);

    outColor = vec4(tracedAlbedo * settings.y , 1.);
}