#version 300 es
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

//    float testLum = (lumaTL + lumaTR + lumaBR + lumaBL + lumaM) * 0.2;
    // GAMMA
    finalColor = vec4(fragment, 1.0);
}
