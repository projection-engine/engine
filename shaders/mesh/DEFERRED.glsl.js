export const vertex = `#version 300 es
layout (location = 0) in vec3 position;
out vec2 texCoord; 
void main() {
    texCoord = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position, 1);
}`

export const fragment = `#version 300 es
precision highp float;

#define MAX_LIGHTS 4
#define MAX_POINT_LIGHTS 24
#define CELLSIZE 2.25
#define PI 3.14159265359
#define SH_C0 0.282094791
#define SH_C1 0.488602512
in vec2 texCoord;
uniform mat3 directionalLightsData[MAX_LIGHTS];
uniform mat4 dirLightPOV[MAX_LIGHTS];
uniform vec3 cameraVec;
uniform mat4 pointLightData[MAX_POINT_LIGHTS];
uniform mat3 settings;

// dirLightQuantity,   shadowMapResolution, noShadowProcessing,
// shadowMapsQuantity, lightQuantity,       hasAO
// pcfSamples,         0,                   0
 
uniform sampler2D aoSampler;
uniform samplerCube shadowCube0;
uniform samplerCube shadowCube1;
uniform sampler2D positionSampler;
uniform sampler2D normalSampler;
uniform sampler2D albedoSampler;
uniform sampler2D behaviourSampler;
uniform sampler2D ambientSampler;
uniform sampler2D depthSampler;
uniform sampler2D shadowMapTexture;
uniform sampler2D screenSpaceReflections;
uniform sampler2D screenSpaceGI;

out vec4 finalColor;

@import(distributionGGX)

@import(geometrySchlickGGX)

@import(geometrySmith)

@import(fresnelSchlick)

@import(fresnelSchlickRoughness)

@import(computeDirectionalLight)
 
@import(calculateShadows)

@import(computePointLight)

void main() {
    float pcfSamples = settings[2][0]; 
    bool hasAO = settings[1][2] == 1.;
    float shadowMapsQuantity = settings[1][0];
    int dirLightQuantity = int(settings[0][0]);
    float shadowMapResolution = settings[0][1]; 
    bool noShadowProcessing = settings[0][2] == 1.; 
    int lightQuantity = int(settings[1][1]);

    ivec2 fragCoord = ivec2(gl_FragCoord.xy);
    vec3 fragPosition = texture(positionSampler, texCoord).rgb;
    if (fragPosition.x == 0.0 && fragPosition.y == 0.0 && fragPosition.z == 0.0)
        discard;

    vec3 albedo = texture(albedoSampler, texCoord).rgb;
    vec3 color;
    if(albedo.r <= 1. && albedo.g <= 1. && albedo.b <= 1.){
        vec3 V = normalize(cameraVec - fragPosition);
        
        vec3 N = texture(normalSampler, texCoord).rgb;
        vec3 ambient = texture(ambientSampler, texCoord).rgb;
        float ao = texture(behaviourSampler, texCoord).r;
        if(hasAO == true)
             ao *= texture(aoSampler, texCoord).r;
            
        float roughness = texture(behaviourSampler, texCoord).g;
        float metallic =texture(behaviourSampler, texCoord).b;
        
        float NdotV    = max(dot(N, V), 0.000001);
        vec3 F0 = vec3(0.04);
        vec3 Lo = vec3(0.0); 
        
        F0 = mix(F0, albedo, metallic);
        
  
    
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
            if(directionalLightsData[i][2][2] == 1. && noShadowProcessing == false)
                shadows += calculateShadows(fragPosLightSpace, atlasFace, shadowMapTexture, shadowMapsQuantity, shadowMapResolution, pcfSamples)/quantityToDivide;
            else
                shadows += 1./quantityToDivide;            
        }
       
        for (int i = 0; i < lightQuantity; ++i){
            vec4 currentLightData = computePointLights(pointLightData[i],  fragPosition, V, N, quantityToDivide, roughness, metallic, albedo, F0, i);
            Lo += currentLightData.rgb;
            float zNear = pointLightData[i][3][0];
            float zFar = pointLightData[i][3][1];
            vec3 positionPLight = vec3(pointLightData[i][0][0], pointLightData[i][0][1], pointLightData[i][0][2]);
            if(currentLightData.a == 1. && i <= 2 && noShadowProcessing == false)
                shadows += pointLightShadow(fragPosition, positionPLight, i, vec2(zNear, zFar))/quantityToDivide;
            else
                shadows += 1./quantityToDivide;            
        }
      
        Lo = (Lo  + texture(screenSpaceReflections, texCoord).rgb)* shadows; 
        vec4 GI = texture(screenSpaceGI, texCoord);
		if(length(GI) >= 0.1 && GI.a > 0.) 
			color = (ambient  + Lo + albedo*(GI.rgb)) * ao ;
		else
   			color = (ambient  + Lo) * ao ;
    }
    else
        color = albedo ;

	finalColor = vec4(color, 1.0);
}
`


export const toScreen = `#version 300 es
precision mediump float;

in vec2 texCoord;

uniform sampler2D uSampler;
out vec4 finalColor;

void main() {
    vec3 fragment = texture(uSampler, texCoord).rgb;   
    finalColor = vec4(fragment, 1.0);
}

`
