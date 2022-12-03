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

float directionalLightShadows(float distanceFromCamera, float shadowFalloffDistance, float bias, vec4 fragPosLightSpace, vec2 faceOffset, sampler2D shadowMapTexture, float shadowMapsQuantity, float shadowMapResolution, float pcfSamples){
    float attenuation = clamp(mix(1., 0., shadowFalloffDistance - distanceFromCamera), 0., 1.);
    if (attenuation == 1.) return 1.;

    float response = 1.0;
    vec3 pos = (fragPosLightSpace.xyz / fragPosLightSpace.w)* 0.5 + 0.5;

    if (pos.z > 1.0)
    pos.z = 1.0;

    float compare = pos.z - bias;

    response = sampleSoftShadows(vec2(pos.x/shadowMapsQuantity + faceOffset.x/shadowMapsQuantity, pos.y/shadowMapsQuantity + faceOffset.y/shadowMapsQuantity), compare, shadowMapTexture, shadowMapResolution, pcfSamples);
    if (response < 1.)
    return min(1., response + attenuation);
    return response;
}




vec3 computeDirectionalLight(float distanceFromCamera, sampler2D shadowMap, float lightsPerShadowAtlas, float shadowAtlasResolution, mat4 lightMatrix, mat4 lightData, vec3 worldPosition, vec3 viewDirection, vec3 F0, float roughness, float metallic, vec3 surfaceNormal, vec3 albedo){
    vec3 lightDirection =  vec3(lightData[0][0], lightData[0][1], lightData[0][2]);
    vec3 lightColor =  vec3(lightData[1][0], lightData[1][1], lightData[1][2]);
    bool hasSSS = lightData[3][2] == 1.;
    float shadows = 1.;
    if (lightData[2][2] > 0.){
        vec4 fragPosLightSpace  = lightMatrix * vec4(worldPosition, 1.0);
        vec2 atlasFace = vec2(lightData[2][0], lightData[2][1]);

        shadows = directionalLightShadows(distanceFromCamera, lightData[3][1], lightData[3][0], fragPosLightSpace, atlasFace, shadowMap, lightsPerShadowAtlas, shadowAtlasResolution, lightData[2][2]);
    }
    float occlusion = hasSSS ? screenSpaceShadows(lightDirection) : 1.;
    if (shadows > 0. && occlusion > 0.){
        lightDirection = normalize(lightDirection);
        vec3 H = normalize(viewDirection + lightDirection);
        float NDF = distributionGGX(surfaceNormal, H, roughness);
        float G   = geometrySmith(surfaceNormal, viewDirection, lightDirection, roughness);
        vec3 F    = fresnelSchlick(max(dot(H, viewDirection), 0.0), F0, roughness);
        vec3 kD = vec3(1.0) - F;
        kD *= 1.0 - metallic;


        vec3 numerator    = NDF * G * F;
        float denominator = 4.0 * max(dot(surfaceNormal, viewDirection), 0.0) * max(dot(surfaceNormal, lightDirection), 0.0) + 0.0001;
        vec3 specular     = numerator / denominator;

        float NdotL = max(dot(surfaceNormal, lightDirection), 0.0);

        return vec3(shadows * (kD * albedo / PI + specular) * lightColor * NdotL);
    }
    return vec3(0.);
}
