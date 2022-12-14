vec3 computeSphereLight( mat4 areaLight, vec3 V, vec3 N, float roughness, float metallic,  vec3 F0){
    vec3 lightPosition = vec3(areaLight[0][0], areaLight[0][1], areaLight[0][2]);
    vec3 lightColor = vec3(areaLight[1][0], areaLight[1][1], areaLight[1][2]);
    float lightCutoff = areaLight[2][3];
    float sphereRadius = areaLight[2][0];
    vec2 lightAttenuation = vec2(areaLight[3][0], areaLight[3][1]);

    float distanceFromFrag = length(lightPosition - worldSpacePosition);
    if(distanceFromFrag > lightCutoff) return vec3(0.);

    float attFactor = 1. / (1. + (lightAttenuation.x * distanceFromFrag) + (lightAttenuation.y * pow(distanceFromFrag, 2.)));
    vec3 L = lightPosition - worldSpacePosition;
    vec3 R = reflect(-V, N);
    vec3 centerToRay = dot(L, R) * R - L;
    vec3 closestPoint = L + centerToRay * clamp(sphereRadius / length(centerToRay), 0., 1.);
    vec3 newLightVector = closestPoint - worldSpacePosition;

    return computeBRDF(newLightVector, lightColor, V, N, roughness, metallic, F0) * attFactor;
}
