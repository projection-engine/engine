#define PI 3.14159265359
#define FRAG_DEPTH_THRESHOLD .0001
#define MAX_LIGHTS 310
#define PARALLAX_THRESHOLD 200.
#define CLAMP_MIN .1
#define CLAMP_MAX .9
#define SEARCH_STEPS 5
#define DEPTH_THRESHOLD 1.2
#define PI_SQUARED 6.2831853
#define DIRECTIONAL 0
#define SPOT 1
#define POINT 2
#define SPHERE 3
#define DISK 4
#define PLANE 5


in mat3 matAttr;
in vec2 texCoords;
in vec3 normalVec;
in vec3 worldSpacePosition;


// GLOBAL

uniform vec2 bufferResolution;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 invProjectionMatrix;
uniform vec3 cameraPosition;
uniform float elapsedTime;

uniform UberShaderSettings {
    float shadowMapsQuantity;
    float shadowMapResolution;
    int lightQuantity;

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

    mat4 lightPrimaryBuffer[MAX_LIGHTS];
    mat4 lightSecondaryBuffer[MAX_LIGHTS];
    int lightTypeBuffer[MAX_LIGHTS];
};





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


out vec4 fragColor;

mat3 TBN;
vec2 quadUV;
vec3 viewDirection;
bool hasTBNComputed = false;
bool hasViewDirectionComputed = false;
float distanceFromCamera;
vec3 V;
bool screenDoorEffect;
vec3 entityID;
bool isSky;
bool ssrEnabled;
bool noDepthChecking;
int materialID;

void extractData() {
    screenDoorEffect = matAttr[1][0] == 1.;
    entityID = vec3(matAttr[0]);
    isSky = matAttr[1][1] == 1.;
    ssrEnabled = matAttr[2][1] == 1.;
    noDepthChecking = matAttr[1][2] == 1.;
    materialID = int(matAttr[2][0]);
}


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

vec2 parallaxOcclusionMapping(vec2 texCoords, vec3 viewDir, bool discardOffPixes, sampler2D heightMap, float heightScale, float layers) {
    if (distanceFromCamera > PARALLAX_THRESHOLD) return texCoords;
    float layerDepth = 1.0 / layers;
    float currentLayerDepth = 0.0;
    vec2 P = viewDir.xy / viewDir.z * heightScale;
    vec2 deltaTexCoords = P / layers;

    vec2 currentUVs = texCoords;
    float currentDepthMapValue = texture(heightMap, currentUVs).r;
    while (currentLayerDepth < currentDepthMapValue) {
        currentUVs -= deltaTexCoords;
        currentDepthMapValue = texture(heightMap, currentUVs).r;
        currentLayerDepth += layerDepth;
    }

    vec2 prevTexCoords = currentUVs + deltaTexCoords;
    float afterDepth = currentDepthMapValue - currentLayerDepth;
    float beforeDepth = texture(heightMap, prevTexCoords).r - currentLayerDepth + layerDepth;


    float weight = afterDepth / (afterDepth - beforeDepth);
    vec2 finalTexCoords = prevTexCoords * weight + currentUVs * (1.0 - weight);

    return finalTexCoords;
}