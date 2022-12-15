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




vec3 computeDirectionalLight(float distanceFromCamera, mat4 lightMatrix, mat4 lightData, vec3 V, vec3 F0, float roughness, float metallic, vec3 N){
    vec3 lightDirection =  vec3(lightData[0][0], lightData[0][1], lightData[0][2]);
    vec3 lightColor =  vec3(lightData[1][0], lightData[1][1], lightData[1][2]);
    bool hasSSS = lightData[3][2] == 1.;
    float shadows = 1.;
    bool hasShadowMap = lightData[2][2] > 0.;

    if (hasShadowMap){
        vec4 lightSpacePosition  = lightMatrix * vec4(worldSpacePosition, 1.0);
        vec2 atlasFace = vec2(lightData[2][0], lightData[2][1]);
        shadows = directionalLightShadows(distanceFromCamera, lightData[3][1], lightData[3][0], lightSpacePosition, atlasFace, shadow_atlas, shadowMapsQuantity, shadowMapResolution, lightData[2][2]);
    }
    if (shadows == 0.) return vec3(0.);
    float occlusion = hasSSS ? screenSpaceShadows(lightDirection) : 1.;
    if (occlusion == 0. ) return vec3(0.);

    return computeBRDF(lightDirection, lightColor, V, N, roughness, metallic, F0);
}
