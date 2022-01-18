#version 300 es
precision highp float;

in vec2 texCoord;
in vec3 dirAmbient;
in vec3 dirDirection;
in vec3 flippedLight;
in mat4 lightSpaceMatrix;

uniform vec3 cameraVec;

uniform vec3 lightPosition[4];
uniform vec3 lightColor[4];
uniform vec3 lightAttenuationFactors[4];
uniform int lightQuantity;

uniform samplerCube irradianceMap;
uniform samplerCube cubeMap;

uniform sampler2D shadowMap;
uniform float shadowMapResolution;

uniform sampler2D positionSampler;
uniform sampler2D normalSampler;
uniform sampler2D albedoSampler;
uniform sampler2D behaviourSampler;




out vec4 finalColor;



// SHADOW-MAP / SOFT-SHADOWS
float sampleShadowMap (vec2 coord, float compare){
    return step(compare, texture(shadowMap, coord.xy).r);
}
float sampleShadowMapLinear (vec2 coord, float compare){


    vec2 shadowTexelSize = vec2(1.0/shadowMapResolution, 1.0/shadowMapResolution);

    vec2 pixelPos = coord.xy/shadowTexelSize + vec2(0.5);
    vec2 fracPart = fract(pixelPos);
    vec2 startTexel = (pixelPos - fracPart) * shadowTexelSize;

    float bottomLeftTexel = sampleShadowMap(startTexel, compare);
    float bottomRightTexel = sampleShadowMap(startTexel + vec2(shadowTexelSize.x, 0.0), compare);
    float topLeftTexel = sampleShadowMap(startTexel + vec2(0.0, shadowTexelSize.y), compare);
    float topRightTexel = sampleShadowMap(startTexel + vec2(shadowTexelSize.x, shadowTexelSize.y), compare);


    float mixOne = mix(bottomLeftTexel, topLeftTexel, fracPart.y);
    float mixTwo = mix(bottomRightTexel, topRightTexel, fracPart.y);

    return mix(mixOne, mixTwo, fracPart.x);
}

float sampleSoftShadows(vec2 coord, float compare){
    const float SAMPLES = 3.0;
    const float SAMPLES_START = (SAMPLES -1.0)/2.0;
    const float SAMPLES_SQUARED = SAMPLES * SAMPLES;

    vec2 shadowTexelSize = vec2(1.0/shadowMapResolution, 1.0/shadowMapResolution);
    float response = 0.0;

    for (float y= -SAMPLES_START; y <= SAMPLES_START; y+=1.0){
        for (float x= -SAMPLES_START; x <= SAMPLES_START; x+=1.0){
            vec2 coordsOffset = vec2(x, y)*shadowTexelSize;
            response += sampleShadowMapLinear(coord + coordsOffset, compare);
        }
    }
    return response/SAMPLES_SQUARED;
}

float calculateShadows (vec4 fragPosLightSpace){
    vec3 pos = (fragPosLightSpace.xyz / fragPosLightSpace.w)* 0.5 + 0.5;
    float depth = texture(shadowMap, pos.xy).r;
    if (pos.z > 1.0){
        pos.z = 1.0;
    }
    float bias = 0.0;
    float compare = pos.z - bias;
    float response = sampleSoftShadows(pos.xy, compare);
    return response;
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
vec3 fresnelSchlickRoughness (float cosTheta, vec3 F0, float roughness){
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow (1.0 - cosTheta, 5.0);
}


void main() {

    ivec2 fragCoord = ivec2(gl_FragCoord.xy);
    // HACK DESGRAÇENTO ( caso fragPos seja tudo zero discarta fragment)
    vec3 fragPosition = texelFetch(positionSampler, fragCoord, 0).xyz;
    if(fragPosition.x == 0.0 && fragPosition.y == 0.0 && fragPosition.z == 0.0)
        discard;

    vec3 V = normalize(cameraVec - fragPosition);
    vec3 albedo = texture(albedoSampler, texCoord).rgb;
    vec3 N = texture(normalSampler, texCoord).rgb;
    float ao = texture(behaviourSampler, texCoord).r;
    float roughness = texture(behaviourSampler, texCoord).g;
    float metallic =texture(behaviourSampler, texCoord).b;


    vec4 fragPosLightSpace  = lightSpaceMatrix * vec4(fragPosition, 1.0);
    vec3 lightDir =  normalize(flippedLight - fragPosition);

    float NdotV    = max(dot(N, V), 0.000001);

    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallic);

    // POINT LIGHTS
    vec3 Lo = vec3(0.0);
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

    // DIFFUSE IBL
    vec3 F    = fresnelSchlickRoughness(NdotV, F0, roughness);
    vec3 kD = (1.0 - F) * (1.0 - metallic);
    vec3 diffuse = texture(irradianceMap, N).rgb * albedo * kD;

    //    const float MAX_REFLECTION = 4.0;
    //    vec3 prefilteredColor = textureLod(pre)

    vec3 ambient = diffuse * ao;

    // SHADOW MAP + TONEMAPPING
    float shadows = calculateShadows(fragPosLightSpace);
    vec3 color = (ambient  + Lo) * shadows ;
    color = color / (color + vec3(1.0));



    finalColor = vec4(color, 1.0);
}
