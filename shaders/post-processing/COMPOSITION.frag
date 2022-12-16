precision highp float;
uniform CompositionSettings{
    vec2 inverseFilterTextureSize;
    bool vignetteEnabled;
    int AAMethod;
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
uniform sampler2D previousFrame;
uniform sampler2D currentFrame;
uniform float filmGrainSeed;
out vec4 finalColor;

// Temporal AA based on Epic Games' implementation:
// https://de45xmedrsdbp.cloudfront.net/Resources/files/TemporalAA_small-59732822.pdf
//
// Originally written by yvt for https://www.shadertoy.com/view/4tcXD2
// Feel free to use this in your shader!

// YUV-RGB conversion routine from Hyper3D

vec3 encodePalYuv(vec3 rgb)
{
    rgb = pow(rgb, vec3(2.0));// gamma correction
    return vec3(
    dot(rgb, vec3(0.299, 0.587, 0.114)),
    dot(rgb, vec3(-0.14713, -0.28886, 0.436)),
    dot(rgb, vec3(0.615, -0.51499, -0.10001))
    );
}

vec3 decodePalYuv(vec3 yuv)
{
    vec3 rgb = vec3(
    dot(yuv, vec3(1., 0., 1.13983)),
    dot(yuv, vec3(1., -0.39465, -0.58060)),
    dot(yuv, vec3(1., 2.03211, 0.))
    );
    return pow(rgb, vec3(1.0 / 2.0));// gamma correction
}


vec4 TAA() {
    vec4 lastColor = texture(previousFrame, texCoords);

    vec3 antialiased = lastColor.xyz;
    float mixRate = min(lastColor.w, 0.5);

    vec2 off = 1.0 / vec2(textureSize(currentFrame, 0));
    vec3 in0 = texture(currentFrame, texCoords).xyz;

    antialiased = mix(antialiased * antialiased, in0 * in0, mixRate);
    antialiased = sqrt(antialiased);

    vec3 in1 = texture(currentFrame, texCoords + vec2(+off.x, 0.0)).xyz;
    vec3 in2 = texture(currentFrame, texCoords + vec2(-off.x, 0.0)).xyz;
    vec3 in3 = texture(currentFrame, texCoords + vec2(0.0, +off.y)).xyz;
    vec3 in4 = texture(currentFrame, texCoords + vec2(0.0, -off.y)).xyz;
    vec3 in5 = texture(currentFrame, texCoords + vec2(+off.x, +off.y)).xyz;
    vec3 in6 = texture(currentFrame, texCoords + vec2(-off.x, +off.y)).xyz;
    vec3 in7 = texture(currentFrame, texCoords + vec2(+off.x, -off.y)).xyz;
    vec3 in8 = texture(currentFrame, texCoords + vec2(-off.x, -off.y)).xyz;

    antialiased = encodePalYuv(antialiased);
    in0 = encodePalYuv(in0);
    in1 = encodePalYuv(in1);
    in2 = encodePalYuv(in2);
    in3 = encodePalYuv(in3);
    in4 = encodePalYuv(in4);
    in5 = encodePalYuv(in5);
    in6 = encodePalYuv(in6);
    in7 = encodePalYuv(in7);
    in8 = encodePalYuv(in8);

    vec3 minColor = min(min(min(in0, in1), min(in2, in3)), in4);
    vec3 maxColor = max(max(max(in0, in1), max(in2, in3)), in4);
    minColor = mix(minColor,
    min(min(min(in5, in6), min(in7, in8)), minColor), 0.5);
    maxColor = mix(maxColor,
    max(max(max(in5, in6), max(in7, in8)), maxColor), 0.5);

    vec3 preclamping = antialiased;
    antialiased = clamp(antialiased, minColor, maxColor);

    mixRate = 1.0 / (1.0 / mixRate + 1.0);

    vec3 diff = antialiased - preclamping;
    float clampAmount = dot(diff, diff);

    mixRate += clampAmount * 4.0;
    mixRate = clamp(mixRate, 0.05, 0.5);

    antialiased = decodePalYuv(antialiased);

    return vec4(antialiased, 1.);
}


vec4 FXAA(){
    vec2 texCoordOffset = inverseFilterTextureSize.xy;

    vec3 luma = vec3(0.299, 0.587, 0.114);
    float lumaTL = dot(luma, texture(currentFrame, texCoords.xy + (vec2(-1.0, -1.0) * texCoordOffset)).xyz);
    float lumaTR = dot(luma, texture(currentFrame, texCoords.xy + (vec2(1.0, -1.0) * texCoordOffset)).xyz);
    float lumaBL = dot(luma, texture(currentFrame, texCoords.xy + (vec2(-1.0, 1.0) * texCoordOffset)).xyz);
    float lumaBR = dot(luma, texture(currentFrame, texCoords.xy + (vec2(1.0, 1.0) * texCoordOffset)).xyz);
    float lumaM  = dot(luma, texture(currentFrame, texCoords.xy).xyz);

    vec2 dir;
    dir.x = -((lumaTL + lumaTR) - (lumaBL + lumaBR));
    dir.y = ((lumaTL + lumaBL) - (lumaTR + lumaBR));

    float dirReduce = max((lumaTL + lumaTR + lumaBL + lumaBR) * (FXAAReduceMul * 0.25), FXAAReduceMin);
    float inverseDirAdjustment = 1.0/(min(abs(dir.x), abs(dir.y)) + dirReduce);

    dir = min(vec2(FXAASpanMax, FXAASpanMax),
    max(vec2(-FXAASpanMax, -FXAASpanMax), dir * inverseDirAdjustment)) * texCoordOffset;

    vec3 result1 = (1.0/2.0) * (
    texture(currentFrame, texCoords.xy + (dir * vec2(1.0/3.0 - 0.5))).xyz +
    texture(currentFrame, texCoords.xy + (dir * vec2(2.0/3.0 - 0.5))).xyz);

    vec3 result2 = result1 * (1.0/2.0) + (1.0/4.0) * (
    texture(currentFrame, texCoords.xy + (dir * vec2(0.0/3.0 - 0.5))).xyz +
    texture(currentFrame, texCoords.xy + (dir * vec2(3.0/3.0 - 0.5))).xyz);

    float lumaMin = min(lumaM, min(min(lumaTL, lumaTR), min(lumaBL, lumaBR)));
    float lumaMax = max(lumaM, max(max(lumaTL, lumaTR), max(lumaBL, lumaBR)));
    float lumaResult2 = dot(luma, result2);

    if (lumaResult2 < lumaMin || lumaResult2 > lumaMax) return vec4(result1, 1.);
    return vec4(result2, 1.);
}

vec3 filmGrain(vec3 fragCurrentColor){

    vec3 color = fragCurrentColor;
    float randomIntensity = fract(10000. * sin((gl_FragCoord.x + gl_FragCoord.y * filmGrainSeed/2.)));
    color += filmGrainStrength * randomIntensity;
    return color;
}

void main() {

    switch (AAMethod){
        case 0:
        finalColor = texture(currentFrame, texCoords);
        break;
        case 1:
        finalColor = FXAA();
        break;
        case 2:
        finalColor = TAA();
        break;
    }

    vec3 corrected = finalColor.rgb;
    corrected = vec3(1.0) - exp(-corrected * exposure);
    corrected = pow(corrected, vec3(1.0/gamma));

    if (filmGrainEnabled)
    corrected = filmGrain(corrected);
    finalColor.rgb = corrected;
    if (vignetteEnabled){
        vec2 uv = texCoords;
        uv *=  1.0 - uv.yx;
        float vig = uv.x*uv.y * 15.;
        vig = pow(vig, vignetteStrength);
        finalColor *= vig;
    }
}

