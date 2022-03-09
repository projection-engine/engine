export const fragment = `
#version 300 es
precision highp float;
// IN
in vec4 vPosition;
in highp vec2 texCoord;
in mat3 toTangentSpace;

in vec3 viewDirection;
 
uniform int parallaxEnabled;
uniform float heightScale;
uniform float layers;
uniform samplerCube irradianceMap;
uniform samplerCube prefilteredMapSampler;

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

// OUTPUTS
layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedo;
layout (location = 3) out vec4 gBehaviour;



vec2 parallaxMapping (vec2 texCoord, vec3 viewDir, sampler2D heightMap, int type)
{
    if(type == 1){
            float layer_depth = 1.0 / layers;
            float currentLayerDepth = 0.0;
            vec2 delta_uv = viewDir.xy * heightScale / (viewDir.z * layers);
            vec2 cur_uv = texCoord;
    
            float depth_from_tex = 1.-texture(heightMap, cur_uv).r;
    
            for (int i = 0; i < 32; i++) {
                currentLayerDepth += layer_depth;
                cur_uv -= delta_uv;
                depth_from_tex = 1.-texture(heightMap, cur_uv).r;
                if (depth_from_tex < currentLayerDepth) {
                    break;
                }
            }
            vec2 prev_uv = cur_uv + delta_uv;
            float next = depth_from_tex - currentLayerDepth;
            float prev = texture(heightMap, prev_uv).r - currentLayerDepth
                         + layer_depth;
            float weight = next / (next - prev);
            vec2 UVs = mix(cur_uv, prev_uv, weight);
//            if (UVs.x > 1.0 || UVs.y > 1.0 || UVs.x < 0.0 || UVs.y < 0.0)
//                discard;
            return UVs;
    }
    else{
//           float depth = texture(heightMap, texCoord).r;    
//            vec2 p = viewDir.xy * (depth * heightScale) / viewDir.z;
            return texCoord ;  
    }
}

void main(){

    gBehaviour = vec4(1.0);
 
   
    gPosition = vPosition;
    
    vec2 UVs = parallaxMapping(texCoord,  viewDirection, pbrMaterial.height, parallaxEnabled);
   
    vec4 albedoTexture = texture(pbrMaterial.albedo, UVs);
    if(albedoTexture.a <= 0.1)
        discard;
        
    gAlbedo = vec4(albedoTexture.rgb, 1.);
 
    gBehaviour = vec4(
        texture(pbrMaterial.ao, UVs).r,
        texture(pbrMaterial.roughness, UVs).r,
        texture(pbrMaterial.metallic, UVs).r,
        1.
    );
    
    gNormal = vec4(normalize(toTangentSpace * ((texture(pbrMaterial.normal, UVs).xyz * 2.0)- 1.0)), 1.0);
}

out vec4 fragColor;
uniform 

out vec4 fragColor;
void main()
{
    float refractiveIndex = 1.5;
    vec3 refractedDirection = refract(normalize(viewDirection), normalize(normalDirection), 1.0 / refractiveIndex);
    fragColor = texture(_Cube, refractedDirection);
}
`
