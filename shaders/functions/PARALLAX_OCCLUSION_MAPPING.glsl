vec2 parallaxOcclusionMapping (vec2 texCoords, vec3 viewDir, bool discardOffPixes, sampler2D heightMap, float heightScale, float layers){
    if(distanceFromCamera > PARALLAX_THRESHOLD)
        return texCoords;
    float layerDepth = 1.0 / layers;
    float currentLayerDepth = 0.0;
    vec2 P = viewDir.xy / viewDir.z * heightScale;
    vec2 deltaTexCoords = P / layers;

    vec2  currentUVs = texCoords;
    float currentDepthMapValue = texture(heightMap, currentUVs).r;
    while (currentLayerDepth < currentDepthMapValue) {
        currentUVs -= deltaTexCoords;
        currentDepthMapValue = texture(heightMap, currentUVs).r;
        currentLayerDepth += layerDepth;
    }

    vec2 prevTexCoords = currentUVs + deltaTexCoords;
    float afterDepth  = currentDepthMapValue - currentLayerDepth;
    float beforeDepth = texture(heightMap, prevTexCoords).r - currentLayerDepth + layerDepth;


    float weight = afterDepth / (afterDepth - beforeDepth);
    vec2 finalTexCoords = prevTexCoords * weight + currentUVs * (1.0 - weight);

    return finalTexCoords;
}