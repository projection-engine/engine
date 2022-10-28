import COMPUTE_DIRECTIONAL_LIGHT from "../utils/COMPUTE_DIRECTIONAL_LIGHT.glsl"
import COMPUTE_POINT_LIGHT from "../utils/COMPUTE_POINT_LIGHT.glsl"

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
    computeDirectionalLight: COMPUTE_DIRECTIONAL_LIGHT,
    computePointLight: COMPUTE_POINT_LIGHT
}