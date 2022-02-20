export const vertex = `#version 300 es

// IN
layout (location = 1) in vec3 position;
layout (location = 2) in vec3 normal;
layout (location = 3) in vec2 uvTexture;
layout (location = 4) in vec3 tangentVec;

// UNIFORM
uniform mat4 viewMatrix;
uniform mat4 transformMatrix;
uniform mat4 projectionMatrix;

uniform mat3 normalMatrix;

// OUT

out vec4 vPosition;
out vec2 texCoord;
out mat3 toTangentSpace;
out vec3 normalVec;

void main(){


    vPosition =  transformMatrix *   vec4(position, 1.0);

    normalVec =   normalMatrix * normal;
    normalVec =   normalize(normalVec);

    // NORMALS
    vec3 bitangent = normalize(cross(normalVec, tangentVec));
    toTangentSpace = mat3(
        tangentVec.x, bitangent.x, normalVec.x,
        tangentVec.y, bitangent.y, normalVec.y,
        tangentVec.z, bitangent.z, normalVec.z
    );
    toTangentSpace = transpose(toTangentSpace);
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
in vec3 normalVec;

// UNIFORMS


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


float getDisplacement (vec2 UVs, sampler2D height){
    return texture(height, UVs).r;
}

void main(){

    gPosition = vec4(1.0);
    gBehaviour = vec4(1.0);
    gAlbedo = vec4(1.0);
    gNormal = vec4(1.0);

    gPosition = vPosition;

    vec3 V = normalize(cameraVec - vPosition.xyz);
    vec2 UVs = texCoord;
    float hScale = 0.05;
    const float minLayers = 8.0;
    const float maxLayers = 64.0;
    float numberLayers = mix(maxLayers, minLayers, abs(dot(vec3(0.0, 0.0, 1.0), V)));
    float layerDepth = 1.0/numberLayers;
    float currentLayerDepth = 0.0;
    vec2 S = V.xy  * hScale;
    vec2 deltaUVs = S/numberLayers;
    float currentDepthMapValue = 1.0 -  getDisplacement(UVs, pbrMaterial.height);
    while (currentLayerDepth < currentDepthMapValue){
        UVs -= deltaUVs;
        currentDepthMapValue = 1.0 -   getDisplacement(UVs, pbrMaterial.height);
        currentLayerDepth +=layerDepth;
    }
    vec2 prevTexCoord = UVs + deltaUVs;
    float afterDepth = currentDepthMapValue - currentLayerDepth;
    float beforeDepth = 1.0 -   getDisplacement(UVs, pbrMaterial.height) - currentLayerDepth + layerDepth;
    float weight = afterDepth/(afterDepth-beforeDepth);
    UVs = prevTexCoord * weight + UVs * (1.0 - weight);

    //    if(UVs.x > 1.0 || UVs.y > 1.0 || UVs.x < 0.0|| UVs.y < 0.0)
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