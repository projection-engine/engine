export const vertex = `#version 300 es
#define MAX_LIGHTS 2
layout (location = 1) in vec3 position;
layout (location = 2) in vec3 normal;
layout (location = 3) in vec2 uvTexture;
layout (location = 4) in vec3 tangentVec;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat3 normalMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraVec;
uniform vec2 uvScale;


struct DirectionalLightPOV {
    mat4 lightProjectionMatrix;
    mat4 lightViewMatrix;
};
uniform DirectionalLightPOV directionalLightsPOV[MAX_LIGHTS];
uniform int dirLightQuantity;


out vec4 vPosition;
out vec2 texCoord;
out mat3 toTangentSpace;
out vec3 normalVec; 
out mat4 dirLightPOV[MAX_LIGHTS];
flat out int dirLightsQuantity;
 
 

void main(){


    vPosition =  transformMatrix *   vec4(position, 1.0);
    
    vec3 T = normalize( normalMatrix  * normalize(tangentVec));
    vec3 N =  normalize(normalMatrix * normal);
    vec3 biTangent = cross(N, tangentVec); 
    vec3 B =  normalize(normalMatrix * biTangent);
    B = dot(biTangent, B)  > 0. ? -B : B;
    
    toTangentSpace = mat3(T, B, N);
 

    texCoord = uvTexture * uvScale;
   
    gl_Position = projectionMatrix * viewMatrix * vPosition;

    dirLightsQuantity = dirLightQuantity;
    for (int i = 0; i< dirLightQuantity; i++){
        dirLightPOV[i] = directionalLightsPOV[i].lightProjectionMatrix * directionalLightsPOV[i].lightViewMatrix;
    }

}
`

export const fragment = `#version 300 es
precision highp float;
// IN
#define MAX_LIGHTS 2
in vec4 vPosition;
in highp vec2 texCoord;
in mat3 toTangentSpace;
flat in int dirLightsQuantity;
in mat4 dirLightPOV[MAX_LIGHTS];
 

uniform vec3 cameraVec;

struct PBR {
    sampler2D albedo;
    sampler2D metallic;
    sampler2D roughness;
    sampler2D normal;
    sampler2D height;
    sampler2D ao;
    sampler2D emissive;
};
uniform PBR pbrMaterial;

uniform vec2 lightClippingPlane[MAX_LIGHTS];
uniform vec3 lightPosition[MAX_LIGHTS];
uniform vec3 lightColor[MAX_LIGHTS];
uniform vec3 lightAttenuationFactors[MAX_LIGHTS];
uniform int lightQuantity;
struct DirectionalLight {
    vec3 direction;
    vec3 ambient;
    vec2 atlasFace;
};
uniform DirectionalLight directionalLights[MAX_LIGHTS];

uniform sampler2D brdfSampler;
uniform samplerCube irradianceMap;
uniform samplerCube prefilteredMapSampler;

// OUTPUTS
out vec4 finalColor;

const float PI = 3.14159265359;

@import(fresnelSchlickRoughness)

@import(fresnelSchlick)

@import(geometrySchlickGGX)

@import(distributionGGX)
 
@import(geometrySmith)
 
@import(computeDirectionalLight)
void main(){
 
    vec4 albedoTex = texture(pbrMaterial.albedo, texCoord);

    if(albedoTex.a <= 0.1)
        discard;
        
    vec3 albedo = vec3(albedoTex);
    float roughness = texture(pbrMaterial.roughness, texCoord).r;
    float metallic = texture(pbrMaterial.metallic, texCoord).r;
    float ao = texture(pbrMaterial.ao, texCoord).r; 
    vec3 fragPosition = vPosition.xyz;
    vec3 N = normalize(toTangentSpace * ((texture(pbrMaterial.normal, texCoord).xyz * 2.0)- 1.0));
    vec3 V = normalize(cameraVec - fragPosition);
    
    float NdotV    = max(dot(N, V), 0.000001);
    vec3 F0 = vec3(0.04);
    vec3 Lo = vec3(0.0);
    F0 = mix(F0, albedo, metallic);
    
    // DIRECTIONAL LIGHT
    float quantityToDivide = float(dirLightsQuantity) + float(lightQuantity);
    for (int i = 0; i < dirLightsQuantity; i++){
        vec4  fragPosLightSpace  = dirLightPOV[i] * vec4(fragPosition, 1.0);
        vec3 lightDir =  normalize(directionalLights[i].direction);

        Lo += computeDirectionalLight(
            V,
            F0,
            lightDir,
            directionalLights[i].ambient,
            fragPosition,
            roughness,
            metallic,
            N,
            albedo
        );
    }
 
    for (int i = 0; i < lightQuantity; ++i){
        vec3 L = normalize(lightPosition[i] - fragPosition);
        vec3 H = normalize(V + L);
        float distance    = length(lightPosition[i] - fragPosition);
        float attFactor = 1.0 / (lightAttenuationFactors[i].x + (lightAttenuationFactors[i].y * distance) + (lightAttenuationFactors[i].z * distance * distance));
        vec3 radiance     = lightColor[i] * attFactor;

        float NDF = distributionGGX(N, H, roughness);
        float G   = geometrySmith(N, V, L, roughness);
        vec3 F    = fresnelSchlick(max(dot(H, V), 0.0), F0);

        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic;

        vec3 numerator    = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
        vec3 specular     = numerator / denominator;

        float NdotL = max(dot(N, L), 0.0);

        
        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
    }
 

    vec3 color = Lo;
    color = color / (color + vec3(1.0));
    finalColor = vec4(color, 1.0);
  
}
`

