export const SHADOWS = {
    sampleShadowMap: `
        float sampleShadowMap (vec2 coord, float compare, sampler2D shadowMapTexture){
            return step(compare, texture(shadowMapTexture, coord.xy).r);
        }
    `,
    sampleShadowMapLinear:`
        float sampleShadowMapLinear (vec2 coord, float compare, sampler2D shadowMapTexture){
            vec2 shadowTexelSize = vec2(1.0/shadowMapResolution, 1.0/shadowMapResolution);
        
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
    `,
    sampleSoftShadows: `
        float sampleSoftShadows(vec2 coord, float compare, sampler2D shadowMapTexture){
            const float SAMPLES = 3.0;
            const float SAMPLES_START = (SAMPLES -1.0)/2.0;
            const float SAMPLES_SQUARED = SAMPLES * SAMPLES;
        
            vec2 shadowTexelSize = vec2(1.0/shadowMapResolution, 1.0/shadowMapResolution);
            float response = 0.0;
        
            for (float y= -SAMPLES_START; y <= SAMPLES_START; y+=1.0){
                for (float x= -SAMPLES_START; x <= SAMPLES_START; x+=1.0){
                    vec2 coordsOffset = vec2(x, y)*shadowTexelSize;
                    response += sampleShadowMapLinear(coord + coordsOffset, compare, shadowMapTexture);
                }
            }
            return response/SAMPLES_SQUARED;
        }
    `,
    calculateShadows:`
        float calculateShadows (vec4 fragPosLightSpace, vec2 faceOffset, sampler2D shadowMapTexture){
            float response = 1.0;
            vec3 pos = (fragPosLightSpace.xyz / fragPosLightSpace.w)* 0.5 + 0.5;
        
            if (pos.z > 1.0){
                pos.z = 1.0;
            }
            float bias = 0.0001;
            float compare = pos.z - bias;
        
            response = sampleSoftShadows(vec2(pos.x/shadowMapsQuantity + faceOffset.x/shadowMapsQuantity, pos.y/shadowMapsQuantity + faceOffset.y/shadowMapsQuantity), compare, shadowMapTexture);
        
            return response;
        }
    `
}