//THANKS TO
float interleavedGradientNoise(vec2 n) {
    float f = 0.06711056 * n.x + 0.00583715 * n.y;
    return fract(52.9829189 * fract(f));
}
vec4 getFragDepth(vec2 coords){
    vec4 depth = textureLod(scene_depth, coords, 2.);
    if(depth.a < 1.)
        return vec4(0.);
    return vec4(viewSpacePositionFromDepth(depth.r, quadUV), 1.);
}

float screenSpaceShadows(vec3 lightDirection){
    int maxSteps = min(100, max(1, maxStepsSSS));
    float stepSize = maxSSSDistance / float(maxSteps);
    float edgeAttenuation = SSSEdgeAttenuation;
    vec3 rayDirection = vec3(viewMatrix * vec4(lightDirection, 0.));
    vec3 rayStepIncrement = rayDirection * stepSize;
    vec4 rayUV = vec4(0.);
    vec3 rayPosition = getViewPosition(quadUV, quadUV);

    rayPosition += rayStepIncrement * interleavedGradientNoise(quadUV);

    for (int i = 0; i < maxSteps; i++) {
        rayPosition += rayStepIncrement;

        rayUV = projectionMatrix * vec4(rayPosition, 1.0);
        rayUV.xy /= rayUV.w;
        rayUV.xy = rayUV.xy * 0.5 + 0.5;

        bool isSaturated = rayUV.x == clamp(rayUV.x, 0., 1.) && rayUV.y == clamp(rayUV.y, 0., 1.);
        if (!isSaturated) return 1.;

        vec4 localDepth = getFragDepth(rayUV.xy);
        if(localDepth.w == 0.) return 1.;

        float currentDepthDelta = rayPosition.z - localDepth.z;
        bool isOccludedByOther = currentDepthDelta > SSSDepthDelta && currentDepthDelta < SSSDepthThickness;

        if (isOccludedByOther){
            vec2 fade = max(vec2(0.), edgeAttenuation * abs(rayUV.xy - 0.5) - 5.);
            return 1. - clamp(1. - dot(fade, fade), 0., 1.);
        }
    }

    return 1.;
}