export const vertex = `#version 300 es

layout (location = 1) in vec3 position;
layout (location = 2) in vec3 normal;
layout (location = 3) in vec2 uvTexture;
layout (location = 4) in vec3 tangentVec;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;

uniform vec3 cameraVec;


out vec4 vPosition;
out vec2 texCoord;
out mat3 toTangentSpace;
out vec3 normalVec;

out vec3 viewPosition;
out vec3 fragPosition;

void main(){


    vPosition =  transformMatrix *   vec4(position, 1.0);
    
    vec3 T = normalize(vec3(transformMatrix * vec4(normalize(tangentVec), .0)));
   vec3 N =  normalize(vec3(transformMatrix * vec4(normal, .0)));
    vec3 biTangent = cross(N, tangentVec); 
    vec3 B =  normalize(vec3(transformMatrix * vec4(biTangent, .0)));
    B = dot(biTangent, B)  > 0. ? -B : B;
    
    toTangentSpace = mat3(T, B, N);
    
    viewPosition = toTangentSpace * cameraVec;
    fragPosition = toTangentSpace *  vPosition.xyz;

    texCoord = uvTexture;
   
    gl_Position = projectionMatrix * viewMatrix * vPosition;
}
`

export const fragment = `#version 300 es
precision highp float;
// IN
in vec4 vPosition;
in highp vec2 texCoord;
in mat3 toTangentSpace;

in vec3 viewPosition;
in vec3 fragPosition;

uniform int parallaxEnabled;
uniform float heightScale;
uniform float layers;

struct PBR {
    sampler2D albedo;
    sampler2D metallic;
    sampler2D roughness;
    sampler2D normal;
    sampler2D height;
    sampler2D ao;
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
            if (UVs.x > 1.0 || UVs.y > 1.0 || UVs.x < 0.0 || UVs.y < 0.0)
                discard;
            return UVs;
    }
    else{
//           float depth = texture(heightMap, texCoord).r;    
//            vec2 p = viewDir.xy * (depth * heightScale) / viewDir.z;
            return texCoord ;  
    }
}

void main(){

    gPosition = vec4(1.0);
    gBehaviour = vec4(1.0);
    gAlbedo = vec4(1.0);
    gNormal = vec4(1.0);
    gPosition = vPosition;
    
    vec2 UVs = parallaxMapping(texCoord,  normalize(fragPosition- viewPosition ), pbrMaterial.height, parallaxEnabled);
   

    vec4 albedoTexture = texture(pbrMaterial.albedo, UVs);
    if(albedoTexture.a <= 0.1)
        discard;
        
    gAlbedo.rgb = albedoTexture.rgb;
    
    gAlbedo.a = 1.0;

    gBehaviour.r = texture(pbrMaterial.ao, UVs).r;
    gBehaviour.g = texture(pbrMaterial.roughness, UVs).r;
    gBehaviour.b = texture(pbrMaterial.metallic, UVs).r;


    gNormal = vec4(normalize(toTangentSpace * ((texture(pbrMaterial.normal, UVs).xyz * 2.0)- 1.0)), 1.0);

}
`


export const wireframeVertex = `#version 300 es

// IN
layout (location = 5) in vec3 position;


// UNIFORM
uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;

out vec4 vPosition;
void main(){
    vPosition =  transformMatrix *   vec4(position, 1.0);
    
    gl_Position = projectionMatrix * viewMatrix * vPosition;
}
`

export const wireframeFragment = `#version 300 es
precision highp float;
 in vec4 vPosition;
 
// OUTPUTS
layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedo;
layout (location = 3) out vec4 gBehaviour;


 

void main(){
    gPosition = vPosition;
    gNormal = vec4(0.0);
    gAlbedo = vec4(1.0, 0.0, 0.0, 1.0);
    gBehaviour = vec4(0.0);
}
`