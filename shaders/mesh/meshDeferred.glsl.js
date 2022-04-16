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

out vec3 viewDirection;
 

void main(){


    vPosition =  transformMatrix *   vec4(position, 1.0);
    
    vec3 T = normalize( mat3(transformMatrix)  * normalize(tangentVec));
    vec3 N =  normalize(mat3(transformMatrix) * normal);
    vec3 biTangent = cross(N, tangentVec); 
    vec3 B =  normalize(mat3(transformMatrix) * biTangent);
    B = dot(biTangent, B)  > 0. ? -B : B;
    
    toTangentSpace = mat3(T, B, N);
    
    viewDirection = transpose(toTangentSpace) * (vPosition.xyz - cameraVec);
   texCoord = uvTexture;
    normalVec = normal;

   
    gl_Position = projectionMatrix * viewMatrix * vPosition;
}
`

export const fragment = `#version 300 es
precision highp float;
// IN
in vec4 vPosition;
in vec3 normalVec;
in mat3 toTangentSpace;

uniform sampler2D brdfSampler;
uniform samplerCube irradianceMap;
uniform samplerCube prefilteredMapSampler;
uniform float ambientLODSamples;
uniform vec3 cameraVec;

// OUTPUTS
layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedo;
layout (location = 3) out vec4 gBehaviour;
layout (location = 4) out vec4 gAmbient;
const float PI = 3.14159265359;


@import(fresnelSchlickRoughness)

//vec2 parallaxMapping (vec2 texCoord, vec3 viewDir, sampler2D heightMap )
//{
//    if(settings.x == 1){
//            float layer_depth = 1.0 / layers;
//            float currentLayerDepth = 0.0;
//            vec2 delta_uv = viewDir.xy * heightScale / (viewDir.z * layers);
//            vec2 cur_uv = texCoord;
//    
//            float depth_from_tex = 1.-texture(heightMap, cur_uv).r;
//    
//            for (int i = 0; i < 32; i++) {
//                currentLayerDepth += layer_depth;
//                cur_uv -= delta_uv;
//                depth_from_tex = 1.-texture(heightMap, cur_uv).r;
//                if (depth_from_tex < currentLayerDepth) {
//                    break;
//                }
//            }
//            vec2 prev_uv = cur_uv + delta_uv;
//            float next = depth_from_tex - currentLayerDepth;
//            float prev = texture(heightMap, prev_uv).r - currentLayerDepth
//                         + layer_depth;
//            float weight = next / (next - prev);
//            vec2 UVs = mix(cur_uv, prev_uv, weight);
//            if (settings.y == 1 && ( UVs.x > 1.0 || UVs.y > 1.0 || UVs.x < 0.0 || UVs.y < 0.0))
//                discard;
//            return UVs;
//    }
//    else{
//            return texCoord ;  
//    }
//}

//settings = [
//    parallaxEnabled,
//    discardOffPixels,
//    generateAmbient
//]

void main(){  
    gPosition = vPosition;

    gAlbedo = vec4(.5, .5, .5, 1.);
    gBehaviour = vec4(1.,1.,0.,1.);
    gNormal = vec4(normalize(toTangentSpace * ((vec3(.5, .5, 1.) * 2.0)- 1.0)), 1.0);
    
    vec3 diffuse = vec3(0.);
    vec3 specular = vec3(0.);
    
    vec3 V = normalize(cameraVec - vPosition.xyz);
    float NdotV    = max(dot(gNormal.rgb, V), 0.000001);
    vec3 F0 = mix(vec3(0.04), gAlbedo.rgb, gBehaviour.b);
    
    vec3 F    = fresnelSchlickRoughness(NdotV, F0, gBehaviour.g);
    vec3 kD = (1.0 - F) * (1.0 - gBehaviour.b);
    diffuse = texture(irradianceMap, gNormal.rgb).rgb * gAlbedo.rgb * kD;

    vec3 prefilteredColor = textureLod(prefilteredMapSampler, reflect(-V, gNormal.rgb), gBehaviour.g * ambientLODSamples).rgb;
    vec2 brdf = texture(brdfSampler, vec2(NdotV, gBehaviour.g)).rg;
    specular = prefilteredColor * (F * brdf.r + brdf.g);

    gAmbient = vec4((diffuse + specular), 1.);
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
