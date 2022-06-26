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
uniform vec3 inverseFilterTextureSize;

uniform ivec2 enabled ;// [fxaa, filmGrain]
uniform  vec4 settings; //[FXAASpanMax, FXAAReduceMin, FXAAReduceMul, amountFilmGrain]
uniform vec3 colorGrading; //[gamma, exposure, elapsed]


out vec4 finalColor;

vec3 FXAA(){
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

    if(lumaResult2 < lumaMin || lumaResult2 > lumaMax)
        return result1;
    else
        return result2;
}

vec3 filmGrain(vec3 fragCurrentColor){

    vec2 texSize  = vec2(textureSize(uSampler, 0).xy);
    vec2 texCoord = gl_FragCoord.xy / texSize;
    
    vec3 color = fragCurrentColor;
    float randomIntensity = fract(10000. * sin((gl_FragCoord.x + gl_FragCoord.y * colorGrading.b/2.)));
    color += settings.w * randomIntensity;
    return color;
}

void main() {  
    vec3 fragment;    

    if(enabled.r == 1)
        fragment = FXAA();
    else
        fragment = texture(uSampler, vTexcoord).rgb;
        
    fragment = vec3(1.0) - exp(-fragment * colorGrading.g);
    fragment = pow(fragment, vec3(1.0/colorGrading.r));

    if(enabled.g == 1)
        fragment = filmGrain(fragment);
      
    finalColor = vec4(fragment, 1.0);
}

`

export const toScreen = `#version 300 es
precision mediump float;

in vec2 vTexcoord;

uniform sampler2D uSampler;
out vec4 finalColor;

void main() {
    vec3 fragment = texture(uSampler, vTexcoord).rgb;   
    finalColor = vec4(fragment, 1.0);
}

`
