float getFragDepth(vec2 coords){
    return viewSpacePositionFromDepth(getLogDepth(coords), quadUV).z;
}

float screenSpaceShadows(vec3 lightDirection){
    int maxSteps = min(100, max(1, maxStepsSSS));
    float stepSize = maxSSSDistance / float(maxSteps);
    float edgeAttenuation = SSSEdgeAttenuation;
    vec3 rayDirection = vec3(viewMatrix * vec4(lightDirection, 0.));
    vec3 rayStepIncrement = rayDirection * stepSize;
    vec4 rayUV = vec4(0.);
    vec3 rayPosition = viewSpacePosition;

    rayPosition += rayStepIncrement * interleavedGradientNoise(texCoords * bufferResolution);

    for (int i = 0; i < maxSteps; i++) {
        rayPosition += rayStepIncrement;

        rayUV = projectionMatrix * vec4(rayPosition, 1.0);
        rayUV.xy /= rayUV.w;
        rayUV.xy = rayUV.xy * 0.5 + 0.5;

        bool isSaturated = rayUV.x == clamp(rayUV.x, 0., 1.) && rayUV.y == clamp(rayUV.y, 0., 1.);
        if (!isSaturated) return 1.;

        float localDepth = getFragDepth(rayUV.xy);
        float currentDepthDelta = rayPosition.z - localDepth;
        bool isOccludedByOther = currentDepthDelta > SSSDepthDelta && currentDepthDelta < SSSDepthThickness;

        if (isOccludedByOther){
            vec2 fade = max(vec2(0.), edgeAttenuation * abs(rayUV.xy - 0.5) - 5.);
            return 1. - clamp(1. - dot(fade, fade), 0., 1.);
        }
    }

    return 1.;
}