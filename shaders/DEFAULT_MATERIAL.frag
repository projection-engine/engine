precision highp float;
#define PI  3.14159265359

in vec2 texCoords;

uniform mat3 settings;
uniform mat3 rgbSamplerScales;
uniform mat3 linearSamplerScales;
uniform mat3 fallbackValues;
uniform mat4 uvScales;

uniform sampler2D albedo;
uniform sampler2D normal;
uniform sampler2D roughness;
uniform sampler2D metallic;
uniform sampler2D ao;
uniform sampler2D emission;
uniform sampler2D heightMap;

uniform int materialID;

uniform sampler2D v_position;
uniform sampler2D v_normal;
uniform sampler2D v_uv;


layout (location = 0) out vec4 g_albedo;
layout (location = 1) out vec4 g_behaviour;

float max3 (vec3 v) {
    return max (max (v.x, v.y), v.z);
}
float min3 (vec3 v) {
    return min (min (v.x, v.y), v.z);
}
vec3 albedoData;
vec3 behaviourData;

void main(){
    vec3 uv_material = texture(v_uv, texCoords).rgb;
    vec4 positionData = texture(v_position, texCoords);
    if (round(uv_material.b * 255.) != round(float(materialID))|| positionData.a < 1.) discard;
    vec2 UVs = uv_material.rg;

    //        vec2 UVs = texCoords;
    //        float POM_HEIGHT_SCALE =  settings[2][0];
    //        float POM_LAYERS =  settings[2][1];
    //        bool POM_DISCARD_OFF_PIXELS = settings[2][2] == 1.;
    //
    //        bool needsTBNMatrix = POM_HEIGHT_SCALE > 0. || settings[0][1] == 1.;
    //        mat3 TBN;
    //        if (needsTBNMatrix == true)
    //        TBN = computeTBN(normalVec, worldSpacePosition, UVs);
    //        if (POM_HEIGHT_SCALE > 0.){
    //            mat3 t = transpose(TBN);
    //            vec3 viewDirection = normalize(t * camera  - t * worldSpacePosition);
    //            UVs = parallaxOcclusionMapping(texCoords, viewDirection, POM_DISCARD_OFF_PIXELS, heightMap, POM_HEIGHT_SCALE, POM_LAYERS);
    //        }
    //

    vec3 albedoScale = vec3(rgbSamplerScales[0][0], rgbSamplerScales[0][1], rgbSamplerScales[0][2]);
    vec3 normalScale = vec3(rgbSamplerScales[1][0], rgbSamplerScales[1][1], rgbSamplerScales[1][2]);
    vec3 emissionScale = vec3(rgbSamplerScales[2][0], rgbSamplerScales[2][1], rgbSamplerScales[2][2]);

    vec4 albedoColor = texture(albedo, UVs * vec2(uvScales[0][0], uvScales[0][1]));
    if (albedoColor.a < 1.) discard;

    vec3 emissionValue = settings[1][2] == 0. ? vec3(fallbackValues[1][0], fallbackValues[1][1], fallbackValues[1][2]) : texture(emission, UVs * vec2(uvScales[2][2], uvScales[2][3])).rgb;
    albedoData = settings[0][0] == 1. ? albedoColor.rgb :  vec3(fallbackValues[0][0], fallbackValues[0][1], fallbackValues[0][2]);

    //        normalData = settings[0][1] == 1. ? TBN * ((texture(normal, UVs * vec2(uvScales[0][2], uvScales[0][3])).rgb * 2.0)- 1.0) : normalVec;
    //        normalData *= normalScale;

    behaviourData.r = settings[1][1] == 0. ? 1. : max3(texture(ao, UVs * vec2(uvScales[2][0], uvScales[2][1])).rgb * vec3(linearSamplerScales[1][0], linearSamplerScales[1][1], linearSamplerScales[1][2]));
    behaviourData.g = settings[0][2] == 1. ? max3(texture(roughness, UVs * vec2(uvScales[1][0], uvScales[1][1])).rgb  * vec3(linearSamplerScales[2][0], linearSamplerScales[2][1], linearSamplerScales[2][2])) : fallbackValues[2][0];
    behaviourData.b = settings[1][0] == 1. ? max3(texture(metallic, UVs* vec2(uvScales[1][2], uvScales[1][3])).rgb * vec3(linearSamplerScales[1][0], linearSamplerScales[1][1], linearSamplerScales[1][2])) : fallbackValues[2][1];


    vec3 pixelAlbedo = albedoData * albedoScale + emissionValue * emissionScale;

    g_albedo = vec4(pixelAlbedo, 1.);
    g_behaviour = vec4(behaviourData, 1.);
}


