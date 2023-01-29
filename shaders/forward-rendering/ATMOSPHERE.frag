//BASED ON https://www.shadertoy.com/view/wsfGWH

precision highp float;
#define PI 3.14159265
#define ONLY_MIE 0
#define ONLY_RAYLEIGH 1
#define COMBINED  2

//import(cameraViewInfo)


in vec2 texCoords;
uniform mat4 information;
uniform mat4 invSkyProjectionMatrix;
uniform int type;
out vec4 fragColor;


float mu;
float muSquared;

vec3 sunDirection;
int samples;
float mieHeight;
float planetRadius;
float atmosphereRadius;
float intensity;
float rayleighHeight;
vec3 rayleighBeta;
vec3 mieBeta;
float G = 0.76;

void unpackInformation() {
    sunDirection = vec3(information[0]);

    rayleighBeta = 1. / vec3(information[0][3], information[1][0], information[1][1]);
    mieBeta = 1. / vec3(information[1][2], information[1][3], information[2][0]);
    intensity = information[2][1];
    atmosphereRadius = information[2][2] * 6420e3;
    planetRadius = information[2][3] * 6360e3;
    rayleighHeight = information[3][0];
    mieHeight = information[3][1];
    samples = int(information[3][2]);
}


float raySphereIntersect(vec3 rayOrigin, vec3 rayDirection, vec3 sphereCenter, float sphereRadius) {
    float a = dot(rayDirection, rayDirection);
    vec3 d = rayOrigin - sphereCenter;
    float b = 2.0 * dot(rayDirection, d);
    float c = dot(d, d) - (sphereRadius * sphereRadius);
    if (b * b - 4.0 * a * c < 0.0) return -1.0;
    return (-b + sqrt((b * b) - 4.0 * a * c)) / (2.0 * a);
}

float rayleighPhase() {
    float phase = (3.0 / (16.0 * PI)) * (1.0 + muSquared);
    return phase;
}

float miePhase() {
    float squaredG = G * G;
    float numerator = (1.0 - squaredG) * (1.0 + muSquared);
    float denominator = (2.0 + squaredG) * pow(1.0 + squaredG - 2.0 * G * mu, 3.0 / 2.0);
    return (3.0 / (8.0 * PI)) * numerator / denominator;
}

vec3 scatteringAtHeight(vec3 scatteringAtSea, float height, float heightScale) {
    return scatteringAtSea * exp(-height / heightScale);
}

float getSampleHeight(vec3 point) {
    return (length(point) - planetRadius);
}


vec3 transmittance(vec3 pa, vec3 pb, int samples, float scaleHeight, vec3 scatCoeffs) {
    float opticalDepth = 0.0;
    float segmentLength = length(pb - pa) / float(samples);
    for (int i = 0; i < samples; i++) {
        vec3 samplePoint = mix(pa, pb, (float(i) + 0.5) / float(samples));
        float sampleHeight = getSampleHeight(samplePoint);
        opticalDepth += exp(-sampleHeight / scaleHeight) * segmentLength;
    }
    vec3 transmittance = exp(-1.0 * scatCoeffs * opticalDepth);
    return transmittance;
}


vec3 getSkyColor(vec3 pa, vec3 pb) {
    mu = dot(normalize(pb - pa), sunDirection);
    muSquared = pow(mu, 2.);

    float phaseR = rayleighPhase();
    float phaseM = miePhase();
    vec3 rayleighColor = vec3(0.0, 0.0, 0.0);
    vec3 mieColor = vec3(0.0, 0.0, 0.0);
    float segmentLength = length(pb - pa) / float(samples);

    for (int i = 0; i < samples; i++) {

        vec3 samplePoint = mix(pa, pb, (float(i) + 0.5) / float(samples));
        float sampleHeight = getSampleHeight(samplePoint);
        float distanceToAtmosphere = raySphereIntersect(samplePoint, sunDirection, vec3(0.0, 0.0, 0.0), atmosphereRadius);
        vec3 atmosphereIntersect = samplePoint + sunDirection * distanceToAtmosphere;

        if (type == ONLY_RAYLEIGH || type == COMBINED) {
            vec3 trans1R = transmittance(pa, samplePoint, 10, rayleighHeight, rayleighBeta);
            vec3 trans2R = transmittance(samplePoint, atmosphereIntersect, 10, rayleighHeight, rayleighBeta);
            rayleighColor += trans1R * trans2R * scatteringAtHeight(rayleighBeta, sampleHeight, rayleighHeight) * segmentLength;
        }

        if (type == ONLY_MIE || type == COMBINED) {
            vec3 trans1M = transmittance(pa, samplePoint, 10, mieHeight, mieBeta);
            vec3 trans2M = transmittance(samplePoint, atmosphereIntersect, 10, mieHeight, mieBeta);
            mieColor += trans1M * trans2M * scatteringAtHeight(mieBeta, sampleHeight, mieHeight) * segmentLength;
        }
    }

    rayleighColor = intensity * phaseR * rayleighColor;
    mieColor = intensity * phaseM * mieColor;

    return rayleighColor + mieColor;

}

vec3 createRay() {
    vec2 pxNDS = texCoords * 2. - 1.;
    vec3 pointNDS = vec3(pxNDS, -1.);
    vec4 pointNDSH = vec4(pointNDS, 1.0);
    vec4 dirEye = invSkyProjectionMatrix * pointNDSH;
    dirEye.w = 0.;
    vec3 dirWorld = (invViewMatrix * dirEye).xyz;
    return normalize(dirWorld);
}

void main() {
    vec3 dir = createRay();

    fragColor = vec4(0., 0., 0., 1.);
    if (dir.y >= information[3][3]) {
        unpackInformation();
        vec3 origin = vec3(0.0, planetRadius + 1.0, 0.0);

        float distanceToAtmosphere = raySphereIntersect(origin, dir, vec3(0.0, 0.0, 0.0), atmosphereRadius);
        vec3 atmosphereIntersect = origin + dir * distanceToAtmosphere;
        fragColor.rgb = getSkyColor(origin, atmosphereIntersect);
    }
}