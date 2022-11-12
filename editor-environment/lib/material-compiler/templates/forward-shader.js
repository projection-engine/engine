export default {
    static: `#version 300 es
  
precision highp float;
#define MAX_POINT_LIGHTS 24
#define MAX_LIGHTS 2
#define PI  3.14159265359 

in vec4 worldSpacePosition;
in vec2 texCoords;
in mat3 toTangentSpace;
uniform int directionalLightsQuantity;
uniform mat3 directionalLightsData[MAX_LIGHTS];
uniform vec3 cameraPosition;
uniform mat4 pointLightData[MAX_POINT_LIGHTS];
uniform int lightQuantity;

in vec3 normalVec;
in mat4 normalMatrix; 
in vec3 viewDirection;  
uniform float elapsedTime;
uniform int shadingModel; 

uniform sampler2D sceneColor;

// OUTPUTS
out vec4 finalColor;
        `,
    wrapper: (body, ambient) => `


${ambient ? `
//import(sampleIndirectLight)
` : ""}
 
  
//import(fresnelSchlick)
//import(geometrySchlickGGX)
//import(distributionGGX)
//import(geometrySmith) 
//import(computeLights)



void main(){
    ${body}
    vec3 fragPosition = worldSpacePosition.xyz;  
    vec3 albedo = vec3(gAlbedo);
    if(shadingModel != -1 && albedo.r <= 1. && albedo.g <= 1. && albedo.b <= 1.){       
        float roughness = gBehaviour.g;
        float metallic = gBehaviour.b;
        float ao = gBehaviour.r;
        vec3 N = vec3(gNormal); 
        
        
        vec3 V = normalize(cameraPosition - fragPosition);
        float NdotV    = max(dot(N, V), 0.000001);
        vec3 F0 = vec3(0.04);
        vec3 Lo = vec3(0.0);
        F0 = mix(F0, albedo, metallic);
        
         for (int i = 0; i < directionalLightsQuantity; i++){
                vec3 lightDir =  normalize(vec3(directionalLightsData[i][0][0], directionalLightsData[i][0][1],directionalLightsData[i][0][2]));
                vec3 lightColor =  vec3(directionalLightsData[i][1][0], directionalLightsData[i][1][1],directionalLightsData[i][1][2]);    
                Lo += computeDirectionalLight(
                    V,
                    F0,
                    lightDir,
                    lightColor, 
                    roughness,
                    metallic,
                    N,
                    albedo
                );
        }
     
        for (int i = 0; i < lightQuantity; ++i){
            vec4 currentLightData = computePointLights(pointLightData[i],  fragPosition, V, N, 1., roughness, metallic, albedo, F0, i);
            Lo += currentLightData.rgb;    
        }
    
       ${ambient ? `
        Lo += computeAmbient(NdotV, metallic, roughness, albedo, F0, V, N, ambientLODSamples, brdfSampler, worldSpacePosition.rgb);
        ` : ""}
    
        finalColor = vec4(Lo, opacity);
    }
    else
       finalColor = vec4(albedo, opacity);        
}
        `,
    inputs: "",
    functions: ""
}
