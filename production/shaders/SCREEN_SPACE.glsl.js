import {vertex as quadVertex} from "./DEFERRED.glsl"

const UNIFORMS = `
uniform vec3 rayMarchSettings; // maxSteps, numBinarySearchSteps, DEPTH_THRESHOLD

uniform mat4 projection;
uniform mat4 viewMatrix;
uniform sampler2D previousFrame;
  
`

const METHODS = `  
${UNIFORMS}
float Metallic;
out vec4 outColor;

vec3 getViewPosition(vec2 coords){
	return  vec3(viewMatrix * textureLod(gPosition, coords, 2.));	
}

vec3 BinarySearch(inout vec3 dir, inout vec3 hitCoord, inout float dDepth)
{
    float depth;
    int numBinarySearchSteps = int(rayMarchSettings.y);
    vec4 projectedCoord;
 
    for(int i = 0; i < numBinarySearchSteps; i++)
    {
        projectedCoord = projection * vec4(hitCoord, 1.0);
        projectedCoord.xy /= projectedCoord.w;
        projectedCoord.xy = projectedCoord.xy * 0.5 + 0.5;
 
        depth = getViewPosition(projectedCoord.xy).z;
        dDepth = hitCoord.z - depth;
        dir *= 0.5;
        if(dDepth > 0.0)
            hitCoord += dir;
        else
            hitCoord -= dir;    
    }

        projectedCoord = projection * vec4(hitCoord, 1.0);
        projectedCoord.xy /= projectedCoord.w;
        projectedCoord.xy = projectedCoord.xy * 0.5 + 0.5;
 
    return vec3(projectedCoord.xy, depth);
}

vec4 RayMarch(vec3 dir, inout vec3 hitCoord, out float dDepth, float stepSize){
    dir *= stepSize;
    float depth;
    int steps;
    vec4 projectedCoord;
    int maxSteps = int(rayMarchSettings.x);
    float depthThreshold = rayMarchSettings.z;
 
    for(int i = 0; i < maxSteps; i++)   {
        hitCoord += dir;
        projectedCoord = projection * vec4(hitCoord, 1.0);
        projectedCoord.xy /= projectedCoord.w;
        projectedCoord.xy = projectedCoord.xy * 0.5 + 0.5;
 
        depth = getViewPosition(projectedCoord.xy).z;
        if(depth > 1000.0)
            continue;
 
        dDepth = hitCoord.z - depth;

        if((dir.z - dDepth) < depthThreshold){
            if(dDepth <= 0.0)
            {   
                vec4 Result;
                Result = vec4(BinarySearch(dir, hitCoord, dDepth), 1.0);

                return Result;
            }
        }
        
        steps++;
    }
 
    
    return vec4(projectedCoord.xy, depth, 0.0);
}

vec3 hash(vec3 a)
{
    a = fract(a * vec3(.8) );
    a += dot(a, a.yxz + 19.19);
    return fract((a.xxy + a.yxx)*a.zyx);
}
`
export const vShader = quadVertex

export const stochasticNormals = `#version 300 es
precision highp float;
#define PI 3.14159265
uniform sampler2D noise;
uniform sampler2D gNormal;
in vec2 texCoord;
uniform vec2 noiseScale;
out vec4 outColor; 
 
float interleavedGradientNoise(vec2 n) {
    float f = 0.06711056 * n.x + 0.00583715 * n.y;
    return fract(10000000.  * fract(f));
}
vec3 cosHemisphereSample(vec2 randVal, vec3 hitNorm)
{ 
	vec3 randomVec  = texture(noise, texCoord * noiseScale).rgb;
	vec3 tangent = normalize(randomVec - hitNorm * dot(randomVec, hitNorm));
	vec3 bitangent = cross(hitNorm, tangent);
	
	float r = sqrt(randVal.x);
	float phi = 2. * PI * randVal.y;

	return tangent * (r * cos(phi)) + bitangent * (r * sin(phi)) + hitNorm.xyz * sqrt(max(0.0, 1. - randVal.x));
}

void main(){
	vec4 worldNormal = texture(gNormal, texCoord);

    vec2 noise = vec2(interleavedGradientNoise(texCoord)); 
    vec3 stochasticNormal = cosHemisphereSample(noise, worldNormal.rgb);
   	outColor = vec4(stochasticNormal, 1.);
}
`


export const ssGI = `#version 300 es
precision highp float;
 
uniform sampler2D gPosition;
uniform sampler2D gNormal; 
   
uniform vec2 settings; // stepSize,  intensity
uniform vec2 noiseScale;
uniform sampler2D noiseSampler;

in vec2 texCoord; 
 
${METHODS}
 vec3 aces(vec3 x) {
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main(){
 
 	vec3 normal = normalize(texture(gNormal, texCoord).rgb);
	vec3 viewPos = getViewPosition(texCoord); 
	vec3 reflected = normalize(reflect(normalize(viewPos), normal));


    vec3 hitPos = viewPos;
    float dDepth;  
    vec2 jitter = texture(noiseSampler, texCoord * noiseScale).rg;
    jitter.x = clamp(jitter.x, 0., 1.);
    jitter.y = clamp(jitter.y, 0., 1.);  
  
	float stepSize = settings.x * (jitter.x + jitter.y) + settings.x;

 	vec4 coords = RayMarch(normal + reflected, hitPos, dDepth, stepSize);
	vec3 tracedAlbedo = aces(texture(previousFrame, coords.xy).rgb);
 
    outColor = vec4(tracedAlbedo * settings.y, 1.);
}
`

// THANKS TO https://imanolfotia.com/blog/1
export const fragment = `#version 300 es
precision highp float;


uniform mat4 invViewMatrix;

uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D gBehaviour;  
const float falloff = 3.0;
const float minRayStep = 0.1; 

in vec2 texCoord;
 
#define CLAMP_MIN .1
#define CLAMP_MAX .9

uniform float stepSize;
${METHODS}

void main(){
 
    vec3 behaviour = texture(gBehaviour, texCoord).rgb;
    Metallic = behaviour.b;
	float roughness = behaviour.g;

    if(Metallic < 0.01)
        discard;
 
    vec3 worldNormal = (texture(gNormal, texCoord) * invViewMatrix).rgb; 
    vec3 viewPos = getViewPosition(texCoord); 
    vec3 reflected = normalize(reflect(normalize(viewPos), normalize(worldNormal)));

    vec3 hitPos = viewPos;
    float dDepth;
     vec3 jitt = mix(vec3(0.0), vec3(hash(viewPos)), roughness);
 	vec4 coords = RayMarch((vec3(jitt) + reflected * max(minRayStep, -viewPos.z)), hitPos, dDepth, stepSize);
    vec2 dCoords = smoothstep(CLAMP_MIN, CLAMP_MAX, abs(vec2(0.5) - coords.xy));
    float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);
    float ReflectionMultiplier = pow(Metallic, falloff) * screenEdgefactor * -reflected.z;
	vec3 tracedAlbedo = texture(previousFrame, coords.xy).rgb; 
      
    outColor = vec4(tracedAlbedo * clamp(ReflectionMultiplier, 0.0, 0.9) , 1.);
}


 

`
