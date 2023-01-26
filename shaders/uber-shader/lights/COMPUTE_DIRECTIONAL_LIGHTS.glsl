float sampleShadowMap (vec2 coord, float compare, sampler2D shadowMapTexture){
    return step(compare, texture(shadowMapTexture, coord.xy).r);
}

float sampleShadowMapLinear (vec2 coord, float compare, sampler2D shadowMapTexture, vec2 shadowTexelSize){
    vec2 pixelPos = coord.xy/shadowTexelSize + vec2(0.5);
    vec2 fracPart = fract(pixelPos);
    vec2 startTexel = (pixelPos - fracPart) * shadowTexelSize;

    float bottomLeftTexel = sampleShadowMap(startTexel, compare, shadowMapTexture);
    float bottomRightTexel = sampleShadowMap(startTexel + vec2(shadowTexelSize.x, 0.0), compare, shadowMapTexture);
    float topLeftTexel = sampleShadowMap(startTexel + vec2(0.0, shadowTexelSize.y), compare, shadowMapTexture);
    float topRightTexel = sampleShadowMap(startTexel + vec2(shadowTexelSize.x, shadowTexelSize.y), compare, shadowMapTexture);


    float mixOne = mix(bottomLeftTexel, topLeftTexel, fracPart.y);
    float mixTwo = mix(bottomRightTexel, topRightTexel, fracPart.y);

    return mix(mixOne, mixTwo, fracPart.x);
}

float sampleSoftShadows(vec2 coord, float compare, sampler2D shadowMapTexture, float shadowMapResolution, float pcfSamples){
    float SAMPLES_START = (pcfSamples -1.0)/2.0;
    float SAMPLES_SQUARED = pcfSamples * pcfSamples;

    vec2 shadowTexelSize = vec2(1.0/shadowMapResolution, 1.0/shadowMapResolution);
    float response = 0.0;

    for (float y= -SAMPLES_START; y <= SAMPLES_START; y+=1.0){
        for (float x= -SAMPLES_START; x <= SAMPLES_START; x+=1.0){
            vec2 coordsOffset = vec2(x, y)*shadowTexelSize;
            response += sampleShadowMapLinear(coord + coordsOffset, compare, shadowMapTexture, shadowTexelSize);
        }
    }
    return response/SAMPLES_SQUARED;
}

float directionalLightShadows(float distanceFromCamera, float shadowFalloffDistance, float bias, vec4 lightSpacePosition, vec2 faceOffset, sampler2D shadowMapTexture, float shadowMapsQuantity, float shadowMapResolution, float pcfSamples){
    float attenuation = clamp(mix(1., 0., shadowFalloffDistance - distanceFromCamera), 0., 1.);
    if (attenuation == 1.) return 1.;

    float response = 1.0;
    vec3 pos = (lightSpacePosition.xyz / lightSpacePosition.w)* 0.5 + 0.5;

    if (pos.z > 1.0)
    pos.z = 1.0;

    float compare = pos.z - bias;

    response = sampleSoftShadows(vec2(pos.x/shadowMapsQuantity + faceOffset.x/shadowMapsQuantity, pos.y/shadowMapsQuantity + faceOffset.y/shadowMapsQuantity), compare, shadowMapTexture, shadowMapResolution, pcfSamples);
    if (response < 1.)
    return min(1., response + attenuation);
    return response;
}




vec3 computeDirectionalLight(inout mat4 primaryBuffer, inout mat4 secondaryBuffer){
    vec3 lightPosition = vec3(primaryBuffer[1][0], primaryBuffer[1][1], primaryBuffer[1][2]);
    vec3 lightColor = vec3(primaryBuffer[0][1], primaryBuffer[0][2], primaryBuffer[0][3]);
    vec4 baseContribution = precomputeContribution(lightPosition);
    if(baseContribution.a == 0.) return vec3(0.);

    bool hasSSS = primaryBuffer[3][2] == 1.;
    float shadows = 1.;
    bool hasShadowMap = primaryBuffer[2][2] > 0.;

    if (hasShadowMap){
        vec4 lightSpacePosition  = secondaryBuffer * vec4(worldSpacePosition, 1.0);
        vec2 atlasFace = vec2(primaryBuffer[2][0], primaryBuffer[2][1]);
        shadows = directionalLightShadows(distanceFromCamera, primaryBuffer[3][1], primaryBuffer[3][0], lightSpacePosition, atlasFace, shadow_atlas, shadowMapsQuantity, shadowMapResolution, primaryBuffer[2][2]);
    }
    if (shadows == 0.) return vec3(0.);
    float occlusion = hasSSS ? screenSpaceShadows(lightPosition) : 1.;
    if (occlusion == 0. ) return vec3(0.);

    return computeBRDF(baseContribution.rgb, baseContribution.a, lightColor);
}
