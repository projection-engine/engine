#version 300 es
precision highp float;

#define PI  3.14159265359
in vec3 normalVec;
in vec2 texCoords;
in vec4 worldSpacePosition;
in vec3 camera;

in vec4 previousScreenPosition;
in vec4 currentScreenPosition;

uniform vec3 meshID;
uniform mat3 settings;
uniform mat3 rgbSamplerScales;
uniform mat3 linearSamplerScales;
uniform mat3 fallbackValues;

uniform sampler2D albedo;
uniform sampler2D normal;
uniform sampler2D roughness;
uniform sampler2D metallic;
uniform sampler2D ao;
uniform sampler2D emission;
uniform sampler2D heightMap;
uniform mat4 uvScales;

layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedo;
layout (location = 3) out vec4 gBehaviour;// AO ROUGHNESS METALLIC
layout (location = 4) out vec4 gDepth;
layout (location = 5) out vec4 gMeshID;
layout (location = 6) out vec4 gBaseNormal;
layout (location = 7) out vec4 gVelocity;

//import(parallaxOcclusionMapping)
//import(computeTBN)

float max3 (vec3 v) {
    return max (max (v.x, v.y), v.z);
}
float min3 (vec3 v) {
    return min (min (v.x, v.y), v.z);
}
void main(){
    vec2 a = (currentScreenPosition.xy / currentScreenPosition.w) * 0.5 + 0.5;
    vec2 b = (previousScreenPosition.xy / previousScreenPosition.w) * 0.5 + 0.5;
    vec2 c = a - b;
    gVelocity = vec4(c, 0., 1.);

    vec2 UVs = texCoords;
    float POM_HEIGHT_SCALE =  settings[2][0];
    float POM_LAYERS =  settings[2][1];
    bool POM_DISCARD_OFF_PIXELS = settings[2][2] == 1.;

    bool needsTBNMatrix = POM_HEIGHT_SCALE > 0. || settings[0][1] == 1.;
    mat3 TBN;
    if (needsTBNMatrix == true)
    TBN = computeTBN(normalVec, worldSpacePosition.xyz, UVs);
    if (POM_HEIGHT_SCALE > 0.){
        mat3 t = transpose(TBN);
        vec3 viewDirection = normalize(t * camera  - t * worldSpacePosition.xyz);
        UVs = parallaxOcclusionMapping(texCoords, viewDirection, POM_DISCARD_OFF_PIXELS, heightMap, POM_HEIGHT_SCALE, POM_LAYERS);
    }

    if (settings[0][1] == 1.)
    gNormal = vec4(TBN * ((texture(normal, UVs * vec2(uvScales[0][2], uvScales[0][3])).rgb * 2.0)- 1.0) * vec3(rgbSamplerScales[1][0], rgbSamplerScales[1][1], rgbSamplerScales[1][2]), 1.);
    else
    gNormal = vec4(normalVec, 1.);

    vec4 albedoColor = texture(albedo, UVs * vec2(uvScales[0][0], uvScales[0][1])) * vec4(rgbSamplerScales[0][0], rgbSamplerScales[0][1], rgbSamplerScales[0][2], 1.);
    if (albedoColor.a < 1.) discard;

    vec3 emissionValue = vec3(0.);
    if (settings[1][2] == 1.)
    emissionValue = texture(emission, UVs * vec2(uvScales[2][2], uvScales[2][3])).rgb * vec3(rgbSamplerScales[2][0], rgbSamplerScales[2][1], rgbSamplerScales[2][2]);
    else
    emissionValue = vec3(fallbackValues[1][0], fallbackValues[1][1], fallbackValues[1][2]);

    if (settings[0][0] == 1.)
    gAlbedo = albedoColor;
    else
    gAlbedo = vec4(fallbackValues[0][0], fallbackValues[0][1], fallbackValues[0][2], 1.);
    gAlbedo = vec4(gAlbedo.rgb + emissionValue, 1.);


    gMeshID = vec4(meshID, 1.);
    gDepth = vec4(gl_FragCoord.z, UVs, 1.);
    gBaseNormal = vec4(normalVec, 1.);
    gPosition = vec4(worldSpacePosition.rgb, 1.);
    gBehaviour =  vec4(1., 0., 0., 1.);






    if (settings[0][2] == 1.)
    gBehaviour.g = max3(texture(roughness, UVs * vec2(uvScales[1][0], uvScales[1][1])).rgb  * vec3(linearSamplerScales[2][0], linearSamplerScales[2][1], linearSamplerScales[2][2]));
    else
    gBehaviour.g = fallbackValues[2][0];

    if (settings[1][0] == 1.)
    gBehaviour.b = max3(texture(metallic, UVs* vec2(uvScales[1][2], uvScales[1][3])).rgb * vec3(linearSamplerScales[1][0], linearSamplerScales[1][1], linearSamplerScales[1][2]));
    else
    gBehaviour.b = fallbackValues[2][1];

    if (settings[1][1] == 1.)
    gBehaviour.r = max3(texture(ao, UVs * vec2(uvScales[2][0], uvScales[2][1])).rgb * vec3(linearSamplerScales[1][0], linearSamplerScales[1][1], linearSamplerScales[1][2]));


}

