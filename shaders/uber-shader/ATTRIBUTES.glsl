#define PI 3.14159265359

#define MAX_LIGHTS 24
#define PARALLAX_THRESHOLD 200.
#define CLAMP_MIN .1
#define CLAMP_MAX .9
#define SEARCH_STEPS 5
#define DEPTH_THRESHOLD 1.2
#define PI_SQUARED 6.2831853

// GLOBAL
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 invProjectionMatrix;
uniform vec3 cameraPosition;
uniform float elapsedTime;

uniform UberShaderSettings{
    float SSRFalloff;

    float stepSizeSSR;
    float maxSSSDistance;

    float SSSDepthThickness;
    float SSSEdgeAttenuation;
    float skylightSamples;
    float SSSDepthDelta;
    float SSAOFalloff;

    int maxStepsSSR;
    int maxStepsSSS;
    bool hasSkylight;
    bool hasAmbientOcclusion;

    vec2 bufferResolution;
};

uniform bool isSky;
uniform sampler2D scene_depth;
uniform sampler2D brdf_sampler;
uniform sampler2D SSAO;
uniform sampler2D SSGI;
uniform sampler2D previousFrame;
uniform sampler2D shadow_atlas;
uniform samplerCube shadow_cube;
uniform samplerCube skylight_specular;
uniform sampler2D sampler0;
uniform sampler2D sampler1;
uniform sampler2D sampler2;
uniform sampler2D sampler3;
uniform sampler2D sampler4;
uniform sampler2D sampler5;
uniform sampler2D sampler6;
uniform sampler2D sampler7;

// GLOBAL
in vec2 texCoords;
in vec3 normalVec;
in vec3 worldSpacePosition;


uniform LightsMetadata{
    float shadowMapsQuantity;
    float shadowMapResolution;
};

uniform LightDataA{
    mat4 lightPrimaryBufferA[MAX_LIGHTS];
    mat4 lightSecondaryBufferA[MAX_LIGHTS];
    mat4 lightTypeBufferA[MAX_LIGHTS];
    int lightQuantityA[MAX_LIGHTS];
};

uniform LightDataB{
    mat4 lightPrimaryBufferB[MAX_LIGHTS];
    mat4 lightSecondaryBufferB[MAX_LIGHTS];
    mat4 lightTypeBufferB[MAX_LIGHTS];
    int lightQuantityB[MAX_LIGHTS];
};

uniform LightDataC{
    mat4 lightPrimaryBufferC[MAX_LIGHTS];
    mat4 lightSecondaryBufferC[MAX_LIGHTS];
    mat4 lightTypeBufferC[MAX_LIGHTS];
    int lightQuantityC[MAX_LIGHTS];
};

//uniform SpotLights{
//    mat4 spotLights[MAX_SPOTLIGHTS];
//    int spotLightsQuantity;
//};
//
//uniform PointLights{
//    mat4 pointLights[MAX_POINTLIGHTS];
//    int pointLightsQuantity;
//};
//
//uniform DirectionalLights{
//    mat4 directionalLights[MAX_DIRECTIONAL_LIGHTS];
//    mat4 directionalLightsPOV[MAX_DIRECTIONAL_LIGHTS];
//    int directionalLightsQuantity;
//    float shadowMapsQuantity;
//    float shadowMapResolution;
//};

uniform bool ssrEnabled;
uniform bool noDepthChecking;
uniform int materialID;

out vec4 fragColor;

mat3 TBN;
vec2 quadUV;
vec3 viewDirection;
bool hasTBNComputed = false;
bool hasViewDirectionComputed = false;
float distanceFromCamera;


void computeTBN() {
    if (hasTBNComputed)
    return;
    hasTBNComputed = true;

    vec3 dp1 = dFdx(worldSpacePosition);
    vec3 dp2 = dFdy(worldSpacePosition);
    vec2 duv1 = dFdx(texCoords);
    vec2 duv2 = dFdy(texCoords);

    vec3 dp2perp = cross(dp2, normalVec);
    vec3 dp1perp = cross(normalVec, dp1);
    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;

    float invmax = inversesqrt(max(dot(T, T), dot(B, B)));
    TBN = mat3(T * invmax, B * invmax, normalVec);
}

vec2 parallaxOcclusionMapping (vec2 texCoords, vec3 viewDir, bool discardOffPixes, sampler2D heightMap, float heightScale, float layers){
    if (distanceFromCamera > PARALLAX_THRESHOLD) return texCoords;
    float layerDepth = 1.0 / layers;
    float currentLayerDepth = 0.0;
    vec2 P = viewDir.xy / viewDir.z * heightScale;
    vec2 deltaTexCoords = P / layers;

    vec2  currentUVs = texCoords;
    float currentDepthMapValue = texture(heightMap, currentUVs).r;
    while (currentLayerDepth < currentDepthMapValue) {
        currentUVs -= deltaTexCoords;
        currentDepthMapValue = texture(heightMap, currentUVs).r;
        currentLayerDepth += layerDepth;
    }

    vec2 prevTexCoords = currentUVs + deltaTexCoords;
    float afterDepth  = currentDepthMapValue - currentLayerDepth;
    float beforeDepth = texture(heightMap, prevTexCoords).r - currentLayerDepth + layerDepth;


    float weight = afterDepth / (afterDepth - beforeDepth);
    vec2 finalTexCoords = prevTexCoords * weight + currentUVs * (1.0 - weight);

    return finalTexCoords;
}