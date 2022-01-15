#version 300 es

precision highp float;
// IN
in vec3 vPosition;
in highp vec2 texCoord;
in vec4 fragPosLightSpace;
in vec3 lightDir;
in vec3 dirAmbient;
in vec3 dirDirection;
in mat3 toTangentSpace;
in vec3 normalVec;

// UNIFORMS
uniform samplerCube skybox;
uniform sampler2D shadowMap;
uniform vec3 cameraVec;
struct PBR {
    sampler2D albedo;
    sampler2D metallic;
    sampler2D roughness;
    sampler2D normal;
    sampler2D height;
    sampler2D ao;
};

uniform PBR pbrMaterial;
uniform vec3 lightPosition[4];
uniform vec3 lightColor[4];
uniform vec3 lightAttenuationFactors[4];
uniform int lightQuantity;
uniform vec3 texelSize;


// OUTPUT
out vec4 finalColor;


// SHADOW-MAP / SOFT-SHADOWS
float calculateShadows (vec4 shadowMapPosition){
    vec3 pos = (shadowMapPosition.xyz / shadowMapPosition.w)* 0.5 + 0.5;
    float depth = texture(shadowMap, pos.xy).r;
    if (pos.z > 1.0){
        pos.z = 1.0;
    }
    float bias = 1.0/1024.0;

    return (depth + bias) < pos.z ? 0.0 : 1.0;
}
float sampleShadowMap (vec4 shadowMapPosition){
    vec3 pos = (shadowMapPosition.xyz / shadowMapPosition.w)* 0.5 + 0.5;
    float depth = texture(shadowMap, pos.xy).r;
    if (pos.z > 1.0){
        pos.z = 1.0;
    }
    float bias = 1.0/1024.0;

    return (depth + bias) < pos.z ? 0.0 : 1.0;
}


// PBR
const float PI = 3.14159265359;

float distributionGGX (vec3 N, vec3 H, float roughness){
    float a2    = roughness * roughness * roughness * roughness;
    float NdotH = max (dot (N, H), 0.0);
    float denom = (NdotH * NdotH * (a2 - 1.0) + 1.0);
    return a2 / (PI * denom * denom);
}

float geometrySchlickGGX (float NdotV, float roughness){
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

float geometrySmith (vec3 N, vec3 V, vec3 L, float roughness){
    return geometrySchlickGGX (max (dot (N, L), 0.0), roughness) *
    geometrySchlickGGX (max (dot (N, V), 0.0), roughness);
}

vec3 fresnelSchlick (float cosTheta, vec3 F0){
    return F0 + (1.0 - F0) * pow (1.0 - cosTheta, 5.0);
}

float getDisplacement (vec2 UVs, sampler2D height){
    return texture(height, UVs).r;
}



// MAIN
void main()
{

    vec3 V = normalize(cameraVec - vPosition);
    vec3 reflectedCoord = reflect(V, normalVec);
    reflectedCoord.y = -reflectedCoord.y;
    vec4 skyboxContribution = vec4(texture(skybox, reflectedCoord).rgb, 1.0);

    // PARALLAX MAPPING QUALITY
    vec2 UVs = texCoord;
    float hScale = 0.05;
    const float minLayers = 8.0;
    const float maxLayers = 64.0;
    float numberLayers = mix(maxLayers, minLayers, abs(dot(vec3(0.0, 0.0, 1.0), V)));
    float layerDepth = 1.0/numberLayers;
    float currentLayerDepth = 0.0;
    vec2 S = V.xy  * hScale;
    vec2 deltaUVs = S/numberLayers;
    float currentDepthMapValue = 1.0 -  getDisplacement(UVs, pbrMaterial.height);


    while (currentLayerDepth < currentDepthMapValue){
        UVs -= deltaUVs;
        currentDepthMapValue = 1.0 -   getDisplacement(UVs, pbrMaterial.height);
        currentLayerDepth +=layerDepth;
    }
    vec2 prevTexCoord = UVs + deltaUVs;
    float afterDepth = currentDepthMapValue - currentLayerDepth;
    float beforeDepth = 1.0 -   getDisplacement(UVs, pbrMaterial.height) - currentLayerDepth + layerDepth;
    float weight = afterDepth/(afterDepth-beforeDepth);
    UVs = prevTexCoord * weight + UVs * (1.0 - weight);

//    if(UVs.x > 1.0 || UVs.y > 1.0 || UVs.x < 0.0|| UVs.y < 0.0)
//        discard;

    // SAMPLES
    float ambientOcclusionMap = texture(pbrMaterial.ao, UVs).r;
    vec3 albedo= texture(pbrMaterial.albedo, UVs).rgb;
    float roughnessMap= texture(pbrMaterial.roughness, UVs).r;
    float metallicMap= texture(pbrMaterial.metallic, UVs).r;
    vec3 normalMap= normalize(toTangentSpace * ((texture(pbrMaterial.normal, UVs).xyz * 2.0)- 1.0));
    vec3 N = normalMap;

    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallicMap);

    // POINT LIGHTS
    vec3 Lo = vec3(0.0);

    for (int i = 0; i < lightQuantity; ++i){
        vec3 L = normalize(lightPosition[i] - vPosition);
        vec3 H = normalize(V + L);
        float distance    = length(lightPosition[i] - vPosition);
        float attFactor = 1.0 / (lightAttenuationFactors[i].x + (lightAttenuationFactors[i].y * distance) + (lightAttenuationFactors[i].z * distance * distance));
        vec3 radiance     = lightColor[i] * attFactor;

        float NDF = distributionGGX(N, H, roughnessMap);
        float G   = geometrySmith(N, V, L, roughnessMap);
        vec3 F    = fresnelSchlick(max(dot(H, V), 0.0), F0);

        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallicMap;

        vec3 numerator    = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
        vec3 specular     = numerator / denominator;

        float NdotL = max(dot(N, L), 0.0);

        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
    }

    vec3 ambient = vec3(0.03) * albedo * ambientOcclusionMap;
    float shadows = calculateShadows(fragPosLightSpace);
    vec3 color = ambient * shadows + Lo;

    color = color / (color + vec3(1.0));
//    color = pow(color, vec3(1.0/2.2));

    finalColor =  vec4(color, 1.0);
}