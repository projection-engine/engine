
export const AMDFSR1 = `#version 300 es
precision highp float;
/*
* FidelityFX Super Resolution scales up a low resolution
* image, while adding fine detail.
*
* MIT Open License
*
* https://gpuopen.com/fsr
*
* Left: FSR processed
* Right: Original texture, bilinear interpolation
*
* Mouse at top: Sharpness 0 stops (maximum)
* Mouse at bottom: Sharpness 2 stops (minimum)
*
* It works in two passes-
*   EASU upsamples the image with a clamped Lanczos kernel.
*   RCAS sharpens the image at the target resolution.
*
* I needed to make a few changes to improve readability and
* WebGL compatibility in an algorithm I don't fully understand.
* Expect bugs.
*
* Shader not currently running for WebGL1 targets (eg. mobile Safari)
*
* There is kind of no point to using FSR in Shadertoy, as it renders buffers
* at full target resolution. But this might be useful for WebGL based demos
* running smaller-than-target render buffers.
*
* For sharpening with a full resolution render buffer,
* FidelityFX CAS is a better option.
* https://www.shadertoy.com/view/ftsXzM
*
* For readability and compatibility, these optimisations have been removed:
*   * Fast approximate inverse and inversesqrt
*   * textureGather fetches (not WebGL compatible)
*   * Multiplying by reciprocal instead of division
*
* Apologies to AMD for the numerous slowdowns and errors I have introduced.
*
*/

/***** RCAS *****/
#define FSR_RCAS_LIMIT (0.25-(1.0/16.0))
//#define FSR_RCAS_DENOISE

// Input callback prototypes that need to be implemented by calling shader


in vec2 vTexcoord;
 

uniform sampler2D uSampler;
uniform float gamma;
uniform float exposure;


out vec4 finalColor;

vec4 FsrRcasLoadF(vec2 p);
//------------------------------------------------------------------------------------------------------------------------------
void FsrRcasCon(
    out float con,
    // The scale is {0.0 := maximum, to N>0, where N is the number of stops (halving) of the reduction of sharpness}.
    float sharpness
){
    // Transform from stops to linear value.
    con = exp2(-sharpness);
}

vec3 FsrRcasF(
    vec2 ip, // Integer pixel position in output.
   float con)
{
    // Constant generated by RcasSetup().
    // Algorithm uses minimal 3x3 pixel neighborhood.
    //    b 
    //  d e f
    //    h
    vec2 sp = vec2(ip);
    vec3 b = FsrRcasLoadF(sp + vec2( 0.,-1.)).rgb;
    vec3 d = FsrRcasLoadF(sp + vec2(-1., 0.)).rgb;
    vec3 e = FsrRcasLoadF(sp).rgb;
    vec3 f = FsrRcasLoadF(sp+vec2( 1., 0.)).rgb;
    vec3 h = FsrRcasLoadF(sp+vec2( 0., 1.)).rgb;
    // Luma times 2.
    float bL = b.g + .5 * (b.b + b.r);
    float dL = d.g + .5 * (d.b + d.r);
    float eL = e.g + .5 * (e.b + e.r);
    float fL = f.g + .5 * (f.b + f.r);
    float hL = h.g + .5 * (h.b + h.r);
    // Noise detection.
    float nz = .25 * (bL + dL + fL + hL) - eL;
    nz=clamp(
        abs(nz)
        /(
            max(max(bL,dL),max(eL,max(fL,hL)))
            -min(min(bL,dL),min(eL,min(fL,hL)))
        ),
        0., 1.
    );
    nz=1.-.5*nz;
    // Min and max of ring.
    vec3 mn4 = min(b, min(f, h));
    vec3 mx4 = max(b, max(f, h));
    // Immediate constants for peak range.
    vec2 peakC = vec2(1., -4.);
    // Limiters, these need to be high precision RCPs.
    vec3 hitMin = mn4 / (4. * mx4);
    vec3 hitMax = (peakC.x - mx4) / (4.* mn4 + peakC.y);
    vec3 lobeRGB = max(-hitMin, hitMax);
    float lobe = max(
        -FSR_RCAS_LIMIT,
        min(max(lobeRGB.r, max(lobeRGB.g, lobeRGB.b)), 0.)
    )*con;
    // Apply noise removal.
    #ifdef FSR_RCAS_DENOISE
    lobe *= nz;
    #endif
    // Resolve, which needs the medium precision rcp approximation to avoid visible tonality changes.
    return (lobe * (b + d + h + f) + e) / (4. * lobe + 1.);
} 


vec4 FsrRcasLoadF(vec2 p) {
    return texture(uSampler,vTexcoord);
} 

void main(){
    float con;
    float sharpness = 0.2;

    FsrRcasCon(con,sharpness);
    
    vec3 fragment = FsrRcasF(gl_FragCoord.xy, con);   
    fragment = vec3(1.0) - exp(-fragment * exposure);
    fragment = pow(fragment, vec3(1.0/gamma));

    finalColor = vec4(fragment, 1.);
}
`

export const vertex = `#version 300 es
layout (location = 0) in vec3 position;
out vec2 vTexcoord;
 

void main() {
    vTexcoord = (position.xy) * 0.5 + 0.5;
    gl_Position = vec4(position, 1.0);
}    
`

export const fragment = `#version 300 es
precision highp float;

in vec2 vTexcoord;

uniform sampler2D uSampler;
uniform float gamma;
uniform float exposure;
uniform vec3 inverseFilterTextureSize;


//uniform float fxaaSpanMax;
//uniform float fxaaReduceMin;
//uniform float fxaaReduceMul;

out vec4 finalColor;

void main() {
    float fxaaSpanMax = 8.0;
    float fxaaReduceMin = 1.0/128.0;
    float fxaaReduceMul = 1.0/8.0;

    vec2 texCoordOffset = inverseFilterTextureSize.xy;

    vec3 luma = vec3(0.299, 0.587, 0.114);
    float lumaTL = dot(luma, texture(uSampler, vTexcoord.xy + (vec2(-1.0, -1.0) * texCoordOffset)).xyz);
    float lumaTR = dot(luma, texture(uSampler, vTexcoord.xy + (vec2(1.0, -1.0) * texCoordOffset)).xyz);
    float lumaBL = dot(luma, texture(uSampler, vTexcoord.xy + (vec2(-1.0, 1.0) * texCoordOffset)).xyz);
    float lumaBR = dot(luma, texture(uSampler, vTexcoord.xy + (vec2(1.0, 1.0) * texCoordOffset)).xyz);
    float lumaM  = dot(luma, texture(uSampler, vTexcoord.xy).xyz);

    vec2 dir;
    dir.x = -((lumaTL + lumaTR) - (lumaBL + lumaBR));
    dir.y = ((lumaTL + lumaBL) - (lumaTR + lumaBR));

    float dirReduce = max((lumaTL + lumaTR + lumaBL + lumaBR) * (fxaaReduceMul * 0.25), fxaaReduceMin);
    float inverseDirAdjustment = 1.0/(min(abs(dir.x), abs(dir.y)) + dirReduce);

    dir = min(vec2(fxaaSpanMax, fxaaSpanMax),
    max(vec2(-fxaaSpanMax, -fxaaSpanMax), dir * inverseDirAdjustment)) * texCoordOffset;

    vec3 result1 = (1.0/2.0) * (
    texture(uSampler, vTexcoord.xy + (dir * vec2(1.0/3.0 - 0.5))).xyz +
    texture(uSampler, vTexcoord.xy + (dir * vec2(2.0/3.0 - 0.5))).xyz);

    vec3 result2 = result1 * (1.0/2.0) + (1.0/4.0) * (
    texture(uSampler, vTexcoord.xy + (dir * vec2(0.0/3.0 - 0.5))).xyz +
    texture(uSampler, vTexcoord.xy + (dir * vec2(3.0/3.0 - 0.5))).xyz);

    float lumaMin = min(lumaM, min(min(lumaTL, lumaTR), min(lumaBL, lumaBR)));
    float lumaMax = max(lumaM, max(max(lumaTL, lumaTR), max(lumaBL, lumaBR)));
    float lumaResult2 = dot(luma, result2);

    vec3 fragment = vec3(0.0);
    if(lumaResult2 < lumaMin || lumaResult2 > lumaMax)
        fragment = result1;
    else
        fragment = result2;

    fragment = vec3(1.0) - exp(-fragment * exposure);
    fragment = pow(fragment, vec3(1.0/gamma));

    // GAMMA
    finalColor = vec4(fragment, 1.0);
}

`

export const noFxaaFragment = `#version 300 es
precision highp float;

in vec2 vTexcoord;

uniform sampler2D uSampler;
uniform float gamma;
uniform float exposure;


out vec4 finalColor;

void main() {
    vec3 fragment = texture(uSampler, vTexcoord).rgb;   
    fragment = vec3(1.0) - exp(-fragment * exposure);
    fragment = pow(fragment, vec3(1.0/gamma));

    finalColor = vec4(fragment, 1.0);
}

`
