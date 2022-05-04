export const PBR = {
    distributionGGX: `
        float distributionGGX (vec3 N, vec3 H, float roughness){
            float a2    = roughness * roughness * roughness * roughness;
            float NdotH = max (dot (N, H), 0.0);
            float denom = (NdotH * NdotH * (a2 - 1.0) + 1.0);
            return a2 / (PI * denom * denom);
        }
    `,
    geometrySchlickGGX: `
        float geometrySchlickGGX (float NdotV, float roughness){
            float r = (roughness + 1.0);
            float k = (r * r) / 8.0;
            return NdotV / (NdotV * (1.0 - k) + k);
        }`,
    geometrySmith: `
        float geometrySmith (vec3 N, vec3 V, vec3 L, float roughness){
            return geometrySchlickGGX (max (dot (N, L), 0.0), roughness) *
            geometrySchlickGGX (max (dot (N, V), 0.0), roughness);
        }
    `,
    fresnelSchlick: `
        vec3 fresnelSchlick (float cosTheta, vec3 F0){
            return F0 + (1.0 - F0) * pow (1.0 - cosTheta, 5.0);
        }
    `,
    fresnelSchlickRoughness: `
        vec3 fresnelSchlickRoughness (float cosTheta, vec3 F0, float roughness){
            return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow (1.0 - cosTheta, 5.0);
        }
    `,
    computeDirectionalLight: `
        vec3 computeDirectionalLight(vec3 V, vec3 F0, vec3 lightDir, vec3 ambient, vec3 fragPosition, float roughness, float metallic, vec3 N, vec3 albedo){
            vec3 L = lightDir;
            vec3 H = normalize(V + L);
            float distance    = length(lightDir - fragPosition);
        
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
        
            return (kD * albedo / PI + specular) * ambient * NdotL;
        }`,
    computePointLight: `
        vec4 computePointLights (in mat4 pointLight, vec3 fragPosition, vec3 V, vec3 N, float quantityToDivide, float roughness, float metallic, vec3 albedo, vec3 F0, int index) {
            vec3 Lo = vec3(0.);    
            float shadows = 1.;
            
            vec3 positionPLight = vec3(pointLight[0][0], pointLight[0][1], pointLight[0][2]);
            vec3 colorPLight = vec3(pointLight[1][0], pointLight[1][1], pointLight[1][2]);
            vec3 attenuationPLight = vec3(pointLight[2][0], pointLight[2][1], pointLight[2][2]);
            float zNear = pointLight[3][0];
            float zFar = pointLight[3][1];
            bool hasShadowMap = pointLight[3][2] == 1.; 
              
            vec3 L = normalize(positionPLight - fragPosition);
            vec3 H = normalize(V + L);
            float distance    = length(positionPLight - fragPosition);
            float attFactor = 1.0 / (attenuationPLight.x + (attenuationPLight.y * distance) + (attenuationPLight.z * distance * distance));
            vec3 radiance     = colorPLight * attFactor;
        
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
            if(hasShadowMap && index <= 2)
                shadows = pointLightShadow(fragPosition, positionPLight, index, vec2(zNear, zFar))/quantityToDivide;
            else
                shadows = 1./quantityToDivide;
                   
               
            Lo = (kD * albedo / PI + specular) * radiance * NdotL;
            return  vec4(Lo, shadows);   
        }`
}