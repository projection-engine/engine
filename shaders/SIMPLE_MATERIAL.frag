#version 300 es
precision highp float;

#define PI  3.14159265359
in vec3 normalVec;
in mat3 toTangentSpace;
in vec2 texCoords;
in vec4 vPosition;
uniform vec3 cameraVec;

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
uniform mat4 uvScales;

//import(ambientUniforms)

layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedo;
layout (location = 3) out vec4 gBehaviour;// AO ROUGHNESS METALLIC
layout (location = 4) out vec4 gAmbient;

layout (location = 5) out vec4 gDepth;
layout (location = 6) out vec4 gMeshID;
layout (location = 7) out vec4 gBaseNormal;

//import(fresnelSchlickRoughness)
//import(ambient)

float max3 (vec3 v) {
    return max (max (v.x, v.y), v.z);
}
float min3 (vec3 v) {
    return min (min (v.x, v.y), v.z);
}

void main(){

    gMeshID = vec4(meshID, 1.);
    gDepth = vec4(gl_FragCoord.z, texCoords, 1.);

    gPosition = vPosition;
    gBehaviour =  vec4(1., 0., 0., 1.);
    vec3 emissionValue = vec3(0.);
    gBaseNormal = vec4(normalVec, 1.);

    if (settings[1][2] == 1.)
    emissionValue = texture(emission, texCoords * vec2(uvScales[2][2], uvScales[2][3])).rgb * vec3(rgbSamplerScales[2][0], rgbSamplerScales[2][1], rgbSamplerScales[2][2]);
    else
    emissionValue = vec3(fallbackValues[1][0], fallbackValues[1][1], fallbackValues[1][2]);

    if (settings[0][0] == 1.)
    gAlbedo = vec4(texture(albedo, texCoords * vec2(uvScales[0][0], uvScales[0][1])).rgb * vec3(rgbSamplerScales[0][0], rgbSamplerScales[0][1], rgbSamplerScales[0][2]), 1.);
    else
    gAlbedo = vec4(fallbackValues[0][0], fallbackValues[0][1], fallbackValues[0][2], 1.);
    gAlbedo = vec4(gAlbedo.rgb + emissionValue, 1.);

    if (settings[0][1] == 1.)
    gNormal = vec4(normalize(toTangentSpace * ((texture(normal, texCoords * vec2(uvScales[0][2], uvScales[0][3])).rgb * 2.0)- 1.0) * vec3(rgbSamplerScales[1][0], rgbSamplerScales[1][1], rgbSamplerScales[1][2])), 1.);
    else
    gNormal = vec4(normalVec, 1.);



    if (settings[0][2] == 1.)
    gBehaviour.g = max3(texture(roughness, texCoords * vec2(uvScales[1][0], uvScales[1][1])).rgb  * vec3(linearSamplerScales[2][0], linearSamplerScales[2][1], linearSamplerScales[2][2]));
    else
    gBehaviour.g = fallbackValues[2][1];

    if (settings[1][0] == 1.)
    gBehaviour.b = max3(texture(metallic, texCoords* vec2(uvScales[1][2], uvScales[1][3])).rgb * vec3(linearSamplerScales[1][0], linearSamplerScales[1][1], linearSamplerScales[1][2]));
    else
    gBehaviour.b = fallbackValues[2][1];

    if (settings[1][1] == 1.)
    gBehaviour.r = max3(texture(ao, texCoords * vec2(uvScales[2][0], uvScales[2][1])).rgb * vec3(linearSamplerScales[1][0], linearSamplerScales[1][1], linearSamplerScales[1][2]));


    vec3 diffuse = vec3(0.);
    vec3 specular = vec3(0.);


    gAmbient = vec4(computeAmbient(cameraVec, gAlbedo.rgb, vPosition.rgb, normalVec, gBehaviour.g, gBehaviour.b, ambientLODSamples, brdfSampler, vPosition.rgb), 1.);
}

