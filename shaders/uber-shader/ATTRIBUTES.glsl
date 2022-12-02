#define PI 3.14159265359

#define MAX_SPOTLIGHTS 24
#define MAX_POINTLIGHTS 24
#define MAX_DIRECTIONAL_LIGHTS 16

#define CLAMP_MIN .1
#define CLAMP_MAX .9
#define SEARCH_STEPS 5
#define DEPTH_THRESHOLD 1.2
#define PI_SQUARED 6.2831853

// GLOBAL
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 invProjectionMatrix;
uniform vec4 rayMarchSettings;
uniform vec2 buffer_resolution;
uniform float skylight_samples;
uniform bool hasSkylight;
uniform bool hasAmbientOcclusion;
uniform float elapsedTime;
uniform vec3 cameraPosition;

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

uniform SpotLights{
    mat4 spotLights[MAX_SPOTLIGHTS];
    int spotLightsQuantity;
};

uniform PointLights{
    mat4 pointLights[MAX_POINTLIGHTS];
    int pointLightsQuantity;
};

uniform DirectionalLights{
    mat4 directionalLights[MAX_DIRECTIONAL_LIGHTS];
    mat4 directionalLightsPOV[MAX_DIRECTIONAL_LIGHTS];
    int directionalLightsQuantity;
    float shadowMapsQuantity;
    float shadowMapResolution;
};

uniform bool ssrEnabled;
uniform bool noDepthChecking;
uniform int materialID;

out vec4 fragColor;

mat3 TBN;
vec2 quadUV;
vec3 viewDirection;
bool hasTBNComputed = false;
bool hasViewDirectionComputed = false;

void computeTBN() {
    if(hasTBNComputed)
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