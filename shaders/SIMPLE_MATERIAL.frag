#version 300 es
precision highp float;

#define PI  3.14159265359
in vec3 normalVec;
in mat3 toTangentSpace;
in vec2 texCoords;
in vec4 worldSpacePosition;
in vec3 viewDirection;
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
uniform sampler2D heightMap;
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
//import(parallaxOcclusionMapping)

float max3 (vec3 v) {
    return max (max (v.x, v.y), v.z);
}
float min3 (vec3 v) {
    return min (min (v.x, v.y), v.z);
}
mat3 cotangent_frame( vec3 N, vec3 p, vec2 uv )
{
    // get edge vectors of the pixel triangle
    vec3 dp1 = dFdx( p );
    vec3 dp2 = dFdy( p );
    vec2 duv1 = dFdx( uv );
    vec2 duv2 = dFdy( uv );

    // solve the linear system
    vec3 dp2perp = cross( dp2, N );
    vec3 dp1perp = cross( N, dp1 );
    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;

    // construct a scale-invariant frame
    float invmax = inversesqrt( max( dot(T,T), dot(B,B) ) );
    return mat3( T * invmax, B * invmax, N );
}
void main(){
    vec2 UVs = texCoords;
    float POM_HEIGHT_SCALE =  settings[2][0];
    float POM_LAYERS =  settings[2][1];
    bool POM_DISCARD_OFF_PIXELS = settings[2][2] == 1.;


    mat3 TBN = cotangent_frame(normalVec, worldSpacePosition.xyz, UVs);
    if(POM_HEIGHT_SCALE > 0.){
        mat3 t = transpose(TBN);
        vec3 vR = normalize(t * cameraVec  - t * worldSpacePosition.xyz);
        UVs = parallaxOcclusionMapping(texCoords, vR, POM_DISCARD_OFF_PIXELS, heightMap, POM_HEIGHT_SCALE, POM_LAYERS);
    }


    vec4 albedoColor = texture(albedo, UVs * vec2(uvScales[0][0], uvScales[0][1])) * vec4(rgbSamplerScales[0][0], rgbSamplerScales[0][1], rgbSamplerScales[0][2], 1.);
    if(albedoColor.a < 1.) discard;

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



    if (settings[0][1] == 1.)
        gNormal = vec4(normalize(TBN * ((texture(normal, UVs * vec2(uvScales[0][2], uvScales[0][3])).rgb * 2.0)- 1.0) * vec3(rgbSamplerScales[1][0], rgbSamplerScales[1][1], rgbSamplerScales[1][2])), 1.);
    else
        gNormal = vec4(normalVec, 1.);



    if (settings[0][2] == 1.)
    gBehaviour.g = max3(texture(roughness, UVs * vec2(uvScales[1][0], uvScales[1][1])).rgb  * vec3(linearSamplerScales[2][0], linearSamplerScales[2][1], linearSamplerScales[2][2]));
    else
    gBehaviour.g = fallbackValues[2][1];

    if (settings[1][0] == 1.)
    gBehaviour.b = max3(texture(metallic, UVs* vec2(uvScales[1][2], uvScales[1][3])).rgb * vec3(linearSamplerScales[1][0], linearSamplerScales[1][1], linearSamplerScales[1][2]));
    else
    gBehaviour.b = fallbackValues[2][1];

    if (settings[1][1] == 1.)
    gBehaviour.r = max3(texture(ao, UVs * vec2(uvScales[2][0], uvScales[2][1])).rgb * vec3(linearSamplerScales[1][0], linearSamplerScales[1][1], linearSamplerScales[1][2]));


    vec3 diffuse = vec3(0.);
    vec3 specular = vec3(0.);


    gAmbient = vec4(computeAmbient(cameraVec, gAlbedo.rgb, worldSpacePosition.rgb, normalVec, gBehaviour.g, gBehaviour.b, ambientLODSamples, brdfSampler, worldSpacePosition.rgb), 1.);
}

