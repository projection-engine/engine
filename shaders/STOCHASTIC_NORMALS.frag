
precision highp float;

//import(cameraUBO)
#define PI 6.2831853
uniform sampler2D noise;
uniform sampler2D gNormal;
in vec2 texCoords;
uniform vec2 noiseScale;
out vec4 fragColor;

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
    float phi = PI * randVal.y;

    return tangent * (r * cos(phi)) + bitangent * (r * sin(phi)) + hitNorm.xyz * sqrt(max(0.0, 1. - randVal.x));
}

void main(){
    vec4 normal = texture(gNormal, texCoords);
    if (normal.a < 1.)
    discard;
    vec4 worldNormal = normal * invViewMatrix;
    fragColor = vec4(cosHemisphereSample(worldNormal.rgb), 1.);
}

