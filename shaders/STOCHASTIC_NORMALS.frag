#version 300 es

precision highp float;
#define PI 3.14159265
uniform sampler2D noise;
uniform sampler2D gNormal;
in vec2 texCoords;
uniform vec2 noiseScale;
out vec4 outColor;
uniform mat4 invViewMatrix;

float interleavedGradientNoise(vec2 n) {
    float f = 0.05 * n.x + 0.05 * n.y;
    return fract(10000.  * fract(f));
}

vec3 cosHemisphereSample(vec2 randVal, vec3 hitNorm)
{
    vec3 randomVec  = texture(noise, texCoords * noiseScale).rgb;
    vec3 tangent = normalize(randomVec - hitNorm * dot(randomVec, hitNorm));
    vec3 bitangent = cross(hitNorm, tangent);

    float r = sqrt(randVal.x);
    float phi = 2. * PI * randVal.y;

    return tangent * (r * cos(phi)) + bitangent * (r * sin(phi)) + hitNorm.xyz * sqrt(max(0.0, 1. - randVal.x));
}

void main(){
    vec4 worldNormal = texture(gNormal, texCoords) * invViewMatrix;

    vec2 noise = vec2(interleavedGradientNoise(texCoords));
    vec3 stochasticNormal = cosHemisphereSample(noise, worldNormal.rgb);
    outColor = vec4(stochasticNormal, 1.);
}