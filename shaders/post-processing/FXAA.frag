
precision highp float;
uniform CompositionSettings{
    vec2 inverseFilterTextureSize;
    bool vignetteEnabled;
    bool fxaaEnabled;
    bool filmGrainEnabled;
    float vignetteStrength;
    float FXAASpanMax;
    float FXAAReduceMin;
    float FXAAReduceMul;
    float filmGrainStrength;
    float gamma;
    float exposure;
};

in vec2 texCoords;
uniform sampler2D uSampler;
uniform float filmGrainSeed;
out vec4 finalColor;

vec3 FXAA(){
    vec2 texCoordOffset = inverseFilterTextureSize.xy;

    vec3 luma = vec3(0.299, 0.587, 0.114);
    float lumaTL = dot(luma, texture(uSampler, texCoords.xy + (vec2(-1.0, -1.0) * texCoordOffset)).xyz);
    float lumaTR = dot(luma, texture(uSampler, texCoords.xy + (vec2(1.0, -1.0) * texCoordOffset)).xyz);
    float lumaBL = dot(luma, texture(uSampler, texCoords.xy + (vec2(-1.0, 1.0) * texCoordOffset)).xyz);
    float lumaBR = dot(luma, texture(uSampler, texCoords.xy + (vec2(1.0, 1.0) * texCoordOffset)).xyz);
    float lumaM  = dot(luma, texture(uSampler, texCoords.xy).xyz);

    vec2 dir;
    dir.x = -((lumaTL + lumaTR) - (lumaBL + lumaBR));
    dir.y = ((lumaTL + lumaBL) - (lumaTR + lumaBR));

    float dirReduce = max((lumaTL + lumaTR + lumaBL + lumaBR) * (FXAAReduceMul * 0.25), FXAAReduceMin);
    float inverseDirAdjustment = 1.0/(min(abs(dir.x), abs(dir.y)) + dirReduce);

    dir = min(vec2(FXAASpanMax, FXAASpanMax),
    max(vec2(-FXAASpanMax, -FXAASpanMax), dir * inverseDirAdjustment)) * texCoordOffset;

    vec3 result1 = (1.0/2.0) * (
    texture(uSampler, texCoords.xy + (dir * vec2(1.0/3.0 - 0.5))).xyz +
    texture(uSampler, texCoords.xy + (dir * vec2(2.0/3.0 - 0.5))).xyz);

    vec3 result2 = result1 * (1.0/2.0) + (1.0/4.0) * (
    texture(uSampler, texCoords.xy + (dir * vec2(0.0/3.0 - 0.5))).xyz +
    texture(uSampler, texCoords.xy + (dir * vec2(3.0/3.0 - 0.5))).xyz);

    float lumaMin = min(lumaM, min(min(lumaTL, lumaTR), min(lumaBL, lumaBR)));
    float lumaMax = max(lumaM, max(max(lumaTL, lumaTR), max(lumaBL, lumaBR)));
    float lumaResult2 = dot(luma, result2);

    if (lumaResult2 < lumaMin || lumaResult2 > lumaMax)
    return result1;
    else
    return result2;
}

vec3 filmGrain(vec3 fragCurrentColor){

    vec3 color = fragCurrentColor;
    float randomIntensity = fract(10000. * sin((gl_FragCoord.x + gl_FragCoord.y * filmGrainSeed/2.)));
    color += filmGrainStrength * randomIntensity;
    return color;
}

void main() {
    vec3 fragment;

    if (fxaaEnabled)
    fragment = FXAA();
    else
    fragment = texture(uSampler, texCoords).rgb;

    fragment = vec3(1.0) - exp(-fragment * exposure);
    fragment = pow(fragment, vec3(1.0/gamma));

    if (filmGrainEnabled)
    fragment = filmGrain(fragment);

    if (vignetteEnabled){
        vec2 uv = texCoords;
        uv *=  1.0 - uv.yx;
        float vig = uv.x*uv.y * 15.;
        vig = pow(vig, vignetteStrength);
        fragment *= vig;
    }
    finalColor = vec4(fragment, 1.0);
}

