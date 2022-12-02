vec3 viewSpacePositionFromDepth(float depth, vec2 texCoords) {
    float z = depth * 2.0 - 1.0;

    vec4 clipSpacePosition = vec4(texCoords * 2.0 - 1.0, z, 1.0);
    vec4 viewSpacePosition = invProjectionMatrix * clipSpacePosition;
    viewSpacePosition /= viewSpacePosition.w;

    return viewSpacePosition.rgb;
}
vec3 normalFromDepth(float depth, vec2 texCoords, sampler2D depthSampler) {
    vec2 texelSize = 1./vec2(textureSize(depthSampler, 0));
    vec2 texCoords1 =texCoords +  vec2(0., 1.)*texelSize;
    vec2 texCoords2 = texCoords +  vec2(1., 0.)*texelSize;

    float depth1 = textureLod(depthSampler, texCoords1, 2.).r;
    float depth2 = textureLod(depthSampler, texCoords2, 2.).r;

    vec3 P0 = viewSpacePositionFromDepth(depth, texCoords);
    vec3 P1 = viewSpacePositionFromDepth(depth1, texCoords1);
    vec3 P2 = viewSpacePositionFromDepth(depth2, texCoords2);

    return normalize(cross(P2 - P0, P1 - P0));
}