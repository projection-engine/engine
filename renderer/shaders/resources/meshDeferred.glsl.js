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
uniform vec3 cameraVec;
// OUT

out vec4 vPosition;
out vec2 texCoord;
out mat3 toTangentSpace;
out vec3 normalVec;
out vec3 viewPosition;
out vec3 fragmentPosition;
out vec3 cameraPos;
void main(){


    vPosition =  transformMatrix *   vec4(position, 1.0);
    normalVec =   normalize(normalMatrix * normal);

    // NORMALS
    vec3 tangent = normalize(tangentVec);
    vec3 bitangent = normalize(cross(normalVec, tangent));
    toTangentSpace = mat3(
        tangent.x, bitangent.x, normalVec.x,
        tangent.y, bitangent.y, normalVec.y,
        tangent.z, bitangent.z, normalVec.z
    );
     viewPosition = toTangentSpace * cameraVec;
    fragmentPosition = toTangentSpace * vPosition.xyz;
    
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
 in vec3 viewPosition;
in vec3 fragmentPosition;




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


vec2 parallaxMapping (vec2 texCoords, vec3 viewDir)
{
    // number of depth layers
    const float minLayers = 8.;
    const float maxLayers = 32.;
    float numLayers = mix(maxLayers, minLayers, abs(dot(vec3(0.0, 0.0, 1.0), viewDir)));  
    // calculate the size of each layer
    float layerDepth = 1.0 / numLayers;
    // depth of current layer
    float currentLayerDepth = 0.0;
    // the amount to shift the texture coordinates per layer (from vector P)
    vec2 P = viewDir.xy / viewDir.z * .1; 
    vec2 deltaTexCoords = P / numLayers;
  
    // get initial values
    vec2  currentTexCoords     = texCoords;
    float currentDepthMapValue = texture(pbrMaterial.height, currentTexCoords).r;
      
    while(currentLayerDepth < currentDepthMapValue)
    {
        // shift texture coordinates along direction of P
        currentTexCoords -= deltaTexCoords;
        // get depthmap value at current texture coordinates
        currentDepthMapValue = texture(pbrMaterial.height, currentTexCoords).r;  
        // get depth of next layer
        currentLayerDepth += layerDepth;  
    }
    
    // get texture coordinates before collision (reverse operations)
    vec2 prevTexCoords = currentTexCoords + deltaTexCoords;

    // get depth after and before collision for linear interpolation
    float afterDepth  = currentDepthMapValue - currentLayerDepth;
    float beforeDepth = texture(pbrMaterial.height, prevTexCoords).r - currentLayerDepth + layerDepth;
 
    // interpolation of texture coordinates
    float weight = afterDepth / (afterDepth - beforeDepth);
    vec2 finalTexCoords = prevTexCoords * weight + currentTexCoords * (1.0 - weight);

    return finalTexCoords;
}

void main(){

    gPosition = vec4(1.0);
    gBehaviour = vec4(1.0);
    gAlbedo = vec4(1.0);
    gNormal = vec4(1.0);

    gPosition = vPosition;

 

    vec3 view_dir = normalize(viewPosition - fragmentPosition);
    
    vec2 UVs = parallaxMapping(texCoord, view_dir);
   
    if (UVs.x > 1.0 || UVs.y > 1.0 || UVs.x < 0.0 || UVs.y < 0.0)
        discard;
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