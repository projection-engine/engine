export const vertex = `#version 300 es

layout (location = 1) in vec3 position;
layout (location = 2) in vec3 normal;
layout (location = 3) in vec2 uvTexture;
layout (location = 4) in vec3 tangentVec;

uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

out vec4 vPosition;
out vec2 texCoord;
out mat3 toTangentSpace;
out vec3 normalVec;
 
out vec3 N;
//out vec3 viewPosition;
//out vec3 fragPosition;

void main(){


    vPosition =  transformMatrix *   vec4(position, 1.0);
    
    vec3 T = normalize(tangentVec); 
    N = normalize(normalMatrix * normal); 
    vec3 B = normalize(cross(N, tangentVec));
    
    toTangentSpace = mat3(T, B, N);
    
//    viewPosition = (toTangentSpace) * cameraVec;
//    fragPosition = (toTangentSpace) * vPosition.xyz;
//    
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

//in vec3 viewPosition;
//in vec3 fragPosition;
in vec3 N;
 
uniform float heightScale;
uniform vec3 cameraVec;

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


vec2 parallaxMapping (vec2 texCoord, vec3 viewDir, sampler2D heightMap)
{
   float numLayers = 32.0 - 31.0 * abs(dot(vec3(0.0, 0.0, 1.0), viewDir));
    float layerDepth = 1.0 / numLayers;

    vec2 P = viewDir.xy / viewDir.z * heightScale;
    vec2 deltaTexCoords = P / numLayers;
    vec2 currentTexCoords = texCoord;

    float currentLayerDepth = 0.0;
    float currentDepthMapValue = texture(heightMap, currentTexCoords).r;
    for (int i=0; i<32; ++ i)
    {
        if (currentLayerDepth >= currentDepthMapValue)
            break;
        currentTexCoords -= deltaTexCoords;
        currentDepthMapValue = texture(heightMap, currentTexCoords).r;
        currentLayerDepth += layerDepth;
    }

    vec2 prevTexCoords = currentTexCoords + deltaTexCoords;
    float afterDepth = currentDepthMapValue - currentLayerDepth;
    float beforeDepth = texture(heightMap, prevTexCoords).r - currentLayerDepth + layerDepth;

    float weight = afterDepth / (afterDepth - beforeDepth);
    return prevTexCoords * weight + currentTexCoords * (1.0 - weight);
}

void main(){

    gPosition = vec4(1.0);
    gBehaviour = vec4(1.0);
    gAlbedo = vec4(1.0);
    gNormal = vec4(1.0);
    gPosition = vPosition;
    
    vec3  dp1     = dFdx( vec3(vPosition) );
    vec3  dp2     = dFdy( vec3(vPosition) );
    vec2  duv1    = dFdx( texCoord );
    vec2  duv2    = dFdy( texCoord );
    vec3  dp2perp = cross(dp2, N);
    vec3  dp1perp = cross(N, dp1);
    vec3  T       = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3  B       = dp2perp * duv1.y + dp1perp * duv2.y;
    float invmax  = inversesqrt(max(dot(T, T), dot(B, B)));
    mat3  tm      = mat3(T * invmax, B * invmax, N);
    mat3  tbn_inv = mat3(vec3(tm[0].x, tm[1].x, tm[2].x), vec3(tm[0].y, tm[1].y, tm[2].y), vec3(tm[0].z, tm[1].z, tm[2].z));

    vec2 UVs = parallaxMapping(texCoord, tbn_inv * normalize( vPosition.xyz - cameraVec ), pbrMaterial.height);
   
//    if (UVs.x > 1.0 || UVs.y > 1.0 || UVs.x < 0.0 || UVs.y < 0.0)
//        discard;
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