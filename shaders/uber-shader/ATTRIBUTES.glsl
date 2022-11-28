#define PI 3.14159265359

mat3 TBN;
vec2 quadUV;

in vec2 texCoords;
in vec3 normalVec;
in vec3 worldSpacePosition;

uniform vec2 buffer_resolution;
uniform vec3 cameraPosition;
uniform PointLights{
    mat4 pointLights[24];
    int pointLightsQuantity;
};

uniform DirectionalLights{
    mat4 directionalLights[16];
    mat4 directionalLightsPOV[16];
    int directionalLightsQuantity;
    float shadowMapsQuantity;
    float shadowMapResolution;
};

uniform sampler2D scene_depth;
uniform sampler2D brdf_sampler;
uniform sampler2D SSAO;
uniform sampler2D SSGI;
uniform sampler2D SSR;
uniform sampler2D shadow_atlas;
uniform samplerCube shadow_cube;

//uniform samplerCube skylight_diffuse;
uniform samplerCube skylight_specular;
uniform float skylight_samples;
uniform bool hasSkylight;


uniform bool noDepthChecking;
uniform bool hasAmbientOcclusion;
uniform float elapsedTime;
uniform int materialID;

out vec4 fragColor;

void computeTBN() {
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