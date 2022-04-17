export const vertex = `#version 300 es
#define MAX_LIGHTS 2
layout (location = 0) in vec3 position;

struct DirectionalLightPOV {
    mat4 lightProjectionMatrix;
    mat4 lightViewMatrix;
};
uniform DirectionalLightPOV directionalLightsPOV[MAX_LIGHTS];
uniform int dirLightQuantity;
out vec2 texCoord;
out mat4 dirLightPOV[MAX_LIGHTS];
flat out int dirLightsQuantity;

void main() {
    dirLightsQuantity = dirLightQuantity;
    for (int i = 0; i< dirLightQuantity; i++){
        dirLightPOV[i] = directionalLightsPOV[i].lightProjectionMatrix * directionalLightsPOV[i].lightViewMatrix;
    }


    texCoord = (position.xy) * 0.5 + 0.5;


    gl_Position = vec4(position, 1);
}    


`

export const fragment = `#version 300 es

precision highp float;

#define MAX_LIGHTS 2
#define CELLSIZE 2.25

#define SH_C0 0.282094791
#define SH_C1 0.488602512

in vec2 texCoord;
flat in int dirLightsQuantity;
in mat4 dirLightPOV[MAX_LIGHTS];


uniform vec3 cameraVec;
uniform int noGI;
uniform float gamma;
uniform float exposure;
uniform vec2 lightClippingPlane[MAX_LIGHTS];
uniform vec3 lightPosition[MAX_LIGHTS];
uniform vec3 lightColor[MAX_LIGHTS];
uniform vec3 lightAttenuationFactors[MAX_LIGHTS];
uniform int lightQuantity;

//uniform samplerCube irradianceMap;
//uniform samplerCube prefilteredMapSampler;
//uniform sampler2D brdfSampler;

uniform float shadowMapResolution;
uniform samplerCube shadowCube0;
uniform samplerCube shadowCube1;

uniform sampler2D positionSampler;
uniform sampler2D normalSampler;
uniform sampler2D albedoSampler;
uniform sampler2D behaviourSampler;
uniform sampler2D ambientSampler;


uniform sampler2D redIndirectSampler;
uniform sampler2D greenIndirectSampler;
uniform sampler2D blueIndirectSampler;

uniform float indirectLightAttenuation;

uniform int gridSize;

struct DirectionalLight {
    vec3 direction;
    vec3 ambient;
    vec2 atlasFace;
};
uniform DirectionalLight directionalLights[MAX_LIGHTS];

uniform sampler2D shadowMapTexture;
//uniform sampler2D previousFrameSampler;
uniform float shadowMapsQuantity;




out vec4 finalColor;

@import(sampleShadowMap)

@import(sampleShadowMapLinear)

@import(sampleSoftShadows)

@import(calculateShadows)

// PBR
const float PI = 3.14159265359;

@import(distributionGGX)

@import(geometrySchlickGGX)

@import(geometrySmith)

@import(fresnelSchlick)

@import(fresnelSchlickRoughness)

@import(computeDirectionalLight)


vec4 dirToSH(vec3 dir){
    return vec4(SH_C0, -SH_C1 * dir.y, SH_C1 * dir.z, -SH_C1 * dir.x);
}
vec3 getGridCellf(vec3 world_space_position, int _max_grid_size) 
{
    const vec3 center = vec3(0.);
    vec3 max_grid_size = vec3(_max_grid_size);
    vec3 min = center - vec3(max_grid_size * 0.5 * CELLSIZE);
    return vec3((world_space_position - min) / CELLSIZE);
}

vec4 sampleGI(in sampler2D t, vec3 gridCell) {
    float f_grid_size = float(gridSize);
    float zFloor = floor(gridCell.z);

    vec2 tex_coord = vec2(gridCell.x / (f_grid_size * f_grid_size) + zFloor / f_grid_size , gridCell.y / f_grid_size);

    vec4 t1 = texture(t, tex_coord);
    vec4 t2 = texture(t, vec2(tex_coord.x + (1.0 / f_grid_size), tex_coord.y));

    return mix(t1,t2, gridCell.z - zFloor);
}

vec3 computeGIIntensity(vec3 fragPosition, vec3 normal)
{
    vec4 sh_intensity = dirToSH(-normalize(normal));
    vec3 gridCell = getGridCellf(fragPosition, gridSize);

    vec4 red = sampleGI(redIndirectSampler, gridCell);
    vec4 green = sampleGI(greenIndirectSampler, gridCell);
    vec4 blue = sampleGI(blueIndirectSampler, gridCell);

    return vec3(dot(sh_intensity, red), dot(sh_intensity, green), dot(sh_intensity, blue));
}

float pointLightShadow(vec3 fragPosition, vec3 lightPos, int index, vec2 shadowClipNearFar) {
    if(index > 1){
        return 1.;
    }else{
        vec3 lightToFrag = normalize(lightPos - fragPosition); 
        float depth;
        if(index == 0 )
            depth = texture(shadowCube0, -lightToFrag).r ;
        else
            depth = texture(shadowCube1,-lightToFrag).r ;
        depth += 0.05;
        float fromLightToFrag = (length(fragPosition - lightPos) - shadowClipNearFar.x)  / (shadowClipNearFar.y - shadowClipNearFar.x);
        
        return  fromLightToFrag > depth ? 0. : 1.; 
    }
}


void main() {
    ivec2 fragCoord = ivec2(gl_FragCoord.xy);
    vec3 fragPosition = texture(positionSampler, texCoord).rgb;
    if (fragPosition.x == 0.0 && fragPosition.y == 0.0 && fragPosition.z == 0.0)
        discard;

    vec3 V = normalize(cameraVec - fragPosition);
    vec3 albedo = texture(albedoSampler, texCoord).rgb;
    vec3 N = texture(normalSampler, texCoord).rgb;
    vec3 ambient = texture(ambientSampler, texCoord).rgb;
    float ao = texture(behaviourSampler, texCoord).r;
 
    float roughness = texture(behaviourSampler, texCoord).g;
    float metallic =texture(behaviourSampler, texCoord).b;
    
    float NdotV    = max(dot(N, V), 0.000001);
    vec3 F0 = vec3(0.04);
    vec3 Lo = vec3(0.0);
    vec3 GI = vec3(0.);
    
    F0 = mix(F0, albedo, metallic);
    
    if(noGI == 0){
        vec3 lpvIntensity = computeGIIntensity(fragPosition, N);
        vec3 lpvRadiance = vec3(max(0.0, lpvIntensity.r), max(0.0, lpvIntensity.g), max(0.0, lpvIntensity.b)) / PI;
        GI = (lpvRadiance * albedo * ao) * indirectLightAttenuation;
    }

    float shadows = dirLightsQuantity > 0 || lightQuantity > 0?  0. : 1.0;
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
        shadows += calculateShadows(fragPosLightSpace, directionalLights[i].atlasFace, shadowMapTexture)/quantityToDivide;
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

        shadows += pointLightShadow(fragPosition, lightPosition[i], i, lightClippingPlane[i])/quantityToDivide;
        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
    }
  
    Lo = Lo* shadows; 

    vec3 color = (ambient  + Lo +  GI) ;
    color = color / (color + vec3(1.0));
    
    color = vec3(1.0) - exp(-color * exposure);
    color = pow(color, vec3(1.0/gamma));
    
    finalColor = vec4(color, 1.0);
}
`