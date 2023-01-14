vec3 computeSphereLight(mat4 areaLight){
    vec3 lightPosition      = vec3(areaLight[0][0], areaLight[0][1], areaLight[0][2]);

    vec3 lightColor         = vec3(areaLight[1][0], areaLight[1][1], areaLight[1][2]);
    float lightCutoff       = areaLight[2][3];
    float lightRadius      = areaLight[2][0];
    vec2 lightAttenuation   = vec2(areaLight[3][0], areaLight[3][1]);
    bool hasSSS             = areaLight[3][3] == 1.;
    vec3 L                    = lightPosition - worldSpacePosition;

    float distanceFromFrag  = length(L);
    if (distanceFromFrag > lightCutoff) return vec3(0.);

    float occlusion         = hasSSS ? screenSpaceShadows(L) : 1.;
    if (occlusion == 0.) return vec3(0.);

    float attFactor         = 1. / (1. + (lightAttenuation.x * distanceFromFrag) + (lightAttenuation.y * pow(distanceFromFrag, 2.)));
    vec3 centerToRay        = dot(L, VrN) * VrN - L;
    vec3 closestPoint        = L + centerToRay * clamp(lightRadius / length(centerToRay), 0.0, 1.0);
    vec4 baseContribution = precomputeContribution(closestPoint + worldSpacePosition);
    if(baseContribution.a == 0.) return vec3(0.);

    return computeBRDF(baseContribution.rgb, baseContribution.a, lightColor) * attFactor;
}


vec3 computeDiskLight(mat4 areaLight){
    vec3 lightPosition = vec3(areaLight[0][0], areaLight[0][1], areaLight[0][2]);
    vec3 lightColor = vec3(areaLight[1][0], areaLight[1][1], areaLight[1][2]);
//    vec3 lightNormal = vec3(areaLight[2][3], areaLight[3][0], areaLight[3][1]);
//    float lightCutoff = areaLight[3][2];
//    float lightRadius = areaLight[2][0];
//    vec2 lightAttenuation = vec2(areaLight[2][1], areaLight[2][2]);
//    bool hasSSS = areaLight[3][3] == 1.;
//    vec3 L = lightPosition - worldSpacePosition;
//    float distanceFromFrag = length(L);
//
//    if (distanceFromFrag > lightCutoff) return vec3(0.);
//
//    float occlusion         = hasSSS ? screenSpaceShadows(L) : 1.;
//    if (occlusion == 0.) return vec3(0.);
//
//    vec3 dir = worldSpacePosition - lightPosition;
//    vec3 planeIntersect = (worldSpacePosition - dot(dir, lightNormal) * lightNormal) - lightPosition;
//    float halfSize = lightRadius * 0.5;
//    vec2 dist2D = vec2(dot(dir, _LightRight), dot(dir, _LightUp));
//    vec2 rectHalf = vec2(halfSize, halfSize);
//    dist2D = clamp(dist2D, -rectHalf, rectHalf);
//    vec3 closestPoint = (lightPosition + (_LightRight * dist2D.x + _LightUp * dist2D.y));
    vec4 baseContribution = precomputeContribution(lightPosition);
    if(baseContribution.a == 0.) return vec3(0.);

    return computeBRDF(baseContribution.rgb, baseContribution.a, lightColor);
}