float naturalAO = 1.;
float roughness = .5;
float metallic = .5;
float refractionIndex=0.;
float alpha = 1.;
vec3 albedo= vec3(.5);
vec3 N = vec3(0.);
vec3 emission = vec3(0.);
bool flatShading = false;

//import(cameraUBO)

in vec2 texCoords;
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

uniform bool hasAO;
uniform sampler2D g_albedo;
uniform sampler2D g_behaviour;
uniform sampler2D g_normal;
uniform sampler2D v_position;

uniform sampler2D ao_sampler;
uniform sampler2D shadowMapTexture;
uniform samplerCube shadowCube;
uniform sampler2D brdfSampler;
uniform sampler2D screenSpaceGI;
uniform sampler2D screenSpaceReflections;

vec2 brdf = vec2(0.);
float NdotV;
vec3 F0 = vec3(0.04);

vec3 fresnelSchlick (float cosTheta, vec3 F0, float roughness){
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow (1.0 - cosTheta, 5.0);
}

vec3 sampleIndirectLight(float shadowValue, float metallic, float roughness, vec3 albedo){
    vec3 diffuseColor = texture(screenSpaceGI, texCoords).rgb;
    vec3 specularColor = texture(screenSpaceReflections, texCoords).rgb * shadowValue;

    if (length(diffuseColor) > 0. || length(specularColor) > 0.){
        vec3 F  = fresnelSchlick(NdotV, F0, roughness);
        vec3 kD = (1.0 - F) * (1.0 - metallic);
        diffuseColor *= albedo * kD;
        specularColor *=  (F * brdf.r + brdf.g);
    }

    return diffuseColor + specularColor;
}

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

//import(computeLights)

void pbLightComputation(out vec4 finalColor) {
    if(flatShading){
        finalColor = vec4(albedo + emission, alpha);
    }else{
        vec3 directIllumination = vec3(0.0);
        vec3 indirectIllumination = vec3(0.0);
        vec3 V = normalize(placement.xyz - worldSpacePosition);
        float ao = naturalAO * texture(ao_sampler, texCoords).r;
        float NdotV = max(dot(N, V), 0.000001);
        brdf = texture(brdfSampler, vec2(NdotV, roughness)).rg;
        F0 = mix(F0, albedo, metallic);

        float shadows = directionalLightsQuantity > 0 || pointLightsQuantity > 0?  0. : 1.0;
        float quantityToDivide = float(directionalLightsQuantity) + float(pointLightsQuantity);
        for (int i = 0; i < directionalLightsQuantity; i++){
            vec4 lightInformation = computeDirectionalLight(shadowMapTexture, shadowMapsQuantity, shadowMapResolution, directionalLightsPOV[i], directionalLights[i], worldSpacePosition, V, F0, roughness, metallic, N, albedo);
            directIllumination += lightInformation.rgb;
            shadows += lightInformation.a/quantityToDivide;
        }

        float viewDistance = length(V);
        for (int i = 0; i < int(pointLightsQuantity); ++i){
            vec4 lightInformation = computePointLights(shadowCube, pointLights[i], worldSpacePosition, viewDistance, V, N, quantityToDivide, roughness, metallic, albedo, F0);
            directIllumination += lightInformation.rgb;
            shadows += lightInformation.a/quantityToDivide;
        }

        indirectIllumination = sampleIndirectLight(shadows, metallic, roughness, albedo);
        finalColor = vec4((directIllumination * shadows + indirectIllumination) * ao + emission, alpha);
    }
}

