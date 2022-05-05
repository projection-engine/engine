export const vertex = `#version 300 es
#define MAX_LIGHTS 4

layout (location = 0) in vec3 position;
 
 
out vec2 texCoord; 
 
void main() {

    texCoord = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position, 1);
}    


`

export const fragment = `#version 300 es
precision highp float;

#define MAX_LIGHTS 4
#define MAX_POINT_LIGHTS 24
#define CELLSIZE 2.25

#define SH_C0 0.282094791
#define SH_C1 0.488602512

in vec2 texCoord;

uniform int dirLightQuantity;
uniform mat3 directionalLightsData[MAX_LIGHTS];
uniform mat4 dirLightPOV[MAX_LIGHTS];


uniform float shadowMapResolution;
uniform float indirectLightAttenuation;
uniform int gridSize;
uniform int noGI; 
uniform vec3 cameraVec;
uniform mat4 pointLightData[MAX_POINT_LIGHTS];
uniform int lightQuantity;
uniform samplerCube shadowCube0;
uniform samplerCube shadowCube1;
uniform sampler2D positionSampler;
uniform sampler2D normalSampler;
uniform sampler2D albedoSampler;
uniform sampler2D behaviourSampler;
uniform sampler2D ambientSampler;
uniform sampler2D emissiveSampler;

uniform sampler2D redIndirectSampler;
uniform sampler2D greenIndirectSampler;
uniform sampler2D blueIndirectSampler;



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

@import(computePointLight)

void main() {
    ivec2 fragCoord = ivec2(gl_FragCoord.xy);
    vec3 fragPosition = texture(positionSampler, texCoord).rgb;
    if (fragPosition.x == 0.0 && fragPosition.y == 0.0 && fragPosition.z == 0.0)
        discard;

    vec3 emissive = texture(emissiveSampler, texCoord).rgb;
    vec3 color;
    if(length(emissive) <= 1.){
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
    
        float shadows = dirLightQuantity > 0 || lightQuantity > 0?  0. : 1.0;
        float quantityToDivide = float(dirLightQuantity) + float(lightQuantity);

         for (int i = 0; i < dirLightQuantity; i++){
            vec4 fragPosLightSpace  = dirLightPOV[i] * vec4(fragPosition, 1.0);
            vec3 lightDir =  normalize(vec3(directionalLightsData[i][0][0], directionalLightsData[i][0][1],directionalLightsData[i][0][2]));
            vec3 lightColor =  vec3(directionalLightsData[i][1][0], directionalLightsData[i][1][1],directionalLightsData[i][1][2]);
            vec2 atlasFace = vec2(directionalLightsData[i][2][0], directionalLightsData[i][2][1]);    
            
            Lo += computeDirectionalLight(
                V,
                F0,
                lightDir,
                lightColor,
                fragPosition,
                roughness,
                metallic,
                N,
                albedo
            );
            if(directionalLightsData[i][2][2] == 1.)
                shadows += calculateShadows(fragPosLightSpace, atlasFace, shadowMapTexture)/quantityToDivide;
            else
                shadows += 1./quantityToDivide;            
        }
       
        for (int i = 0; i < lightQuantity; ++i){
            vec4 currentLightData = computePointLights(pointLightData[i],  fragPosition, V, N, quantityToDivide, roughness, metallic, albedo, F0, i);
            Lo += currentLightData.rgb;
            float zNear = pointLightData[i][3][0];
            float zFar = pointLightData[i][3][1];
            vec3 positionPLight = vec3(pointLightData[i][0][0], pointLightData[i][0][1], pointLightData[i][0][2]);
            if(currentLightData.a == 1. && i <= 2)
                shadows += pointLightShadow(fragPosition, positionPLight, i, vec2(zNear, zFar))/quantityToDivide;
            else
                shadows += 1./quantityToDivide;            
        }
      
        Lo = Lo* shadows; 
        
        color = (ambient  + Lo +  GI + emissive);
    }
    else
        color = emissive ;
 
    finalColor = vec4(color, 1.0);
}
`