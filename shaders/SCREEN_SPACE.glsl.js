import {vertex as quadVertex} from "./mesh/DEFERRED.glsl"



const METHODS = `
uniform float stepSize; 
uniform float maxSteps; 

const float minRayStep = 0.1; 
const int numBinarySearchSteps = 5;
const float falloff = 3.0;
float Metallic;
#define Scale vec3(.8)
#define K 19.19
out vec4 outColor;

vec3 getViewPosition(vec2 coords){
	return  vec3(viewMatrix * textureLod(gPosition, coords, 2.));	
}

vec3 BinarySearch(inout vec3 dir, inout vec3 hitCoord, inout float dDepth)
{
    float depth;

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

vec4 RayMarch(vec3 dir, inout vec3 hitCoord, out float dDepth){
    dir *= stepSize;
    float depth;
    int steps;
    vec4 projectedCoord;
 
    for(int i = 0; i < int(maxSteps); i++)   {
        hitCoord += dir;
        projectedCoord = projection * vec4(hitCoord, 1.0);
        projectedCoord.xy /= projectedCoord.w;
        projectedCoord.xy = projectedCoord.xy * 0.5 + 0.5;
 
        depth = getViewPosition(projectedCoord.xy).z;
        if(depth > 1000.0)
            continue;
 
        dDepth = hitCoord.z - depth;

        if((dir.z - dDepth) < 1.2)
        {
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
    a = fract(a * Scale);
    a += dot(a, a.yxz + K);
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
 
out vec4 outColor;
const float noiseScale = .5;

float interleavedGradientNoise(vec2 n) {
    float f = 0.06711056 * n.x + 0.00583715 * n.y;
    return fract(10000000. * fract(f));
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

uniform sampler2D previousFrame;
uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D depthSampler;

uniform float intensity;
uniform mat4 projection;
uniform mat4 viewMatrix;  
uniform mat4 invViewMatrix;
in vec2 texCoord;

 
${METHODS}
 
void main(){
	if(texture(depthSampler, texCoord).r <= .1)
		discard; 
		 
 	vec3 normal = normalize(texture(gNormal, texCoord).rgb);
	vec3 viewPos = getViewPosition(texCoord); 
	// vec3 reflected = normalize(reflect(normalize(viewPos), normal));


    vec3 hitPos = viewPos;
    float dDepth;  
 	vec4 coords = RayMarch(normal, hitPos, dDepth);
 
    outColor = vec4(texture(previousFrame, coords.xy).rgb * .3 * intensity, 1.);
}
`

// THANKS TO https://imanolfotia.com/blog/1
export const fragment = `#version 300 es
precision highp float;

uniform sampler2D previousFrame;
uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D gBehaviour; 

uniform mat4 projection;
uniform mat4 viewMatrix;  
uniform mat4 invViewMatrix;
in vec2 texCoord;
 
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
 	vec4 coords = RayMarch((vec3(jitt) + reflected * max(minRayStep, -viewPos.z)), hitPos, dDepth);
    vec2 dCoords = smoothstep(0.2, 0.6, abs(vec2(0.5) - coords.xy));
    float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);
    float ReflectionMultiplier = pow(Metallic, falloff) * 
                screenEdgefactor * 
                -reflected.z;
	vec3 tracedAlbedo = texture(previousFrame, coords.xy).rgb;
    vec3 SSR = tracedAlbedo * clamp(ReflectionMultiplier, 0.0, 0.9) ;
      
    outColor = vec4(SSR, Metallic);
}


 

`
