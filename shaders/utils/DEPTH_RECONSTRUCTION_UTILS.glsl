vec3 WorldPosFromDepth(float depth) {
    float z = depth * 2.0 - 1.0;

    vec4 clipSpacePosition = vec4(texCoords * 2.0 - 1.0, z, 1.0);
    vec4 viewSpacePosition = invProjectionMatrix * clipSpacePosition;
    viewSpacePosition /= viewSpacePosition.w;

    vec4 worldSpacePosition = invViewMatrix * viewSpacePosition;
    return worldSpacePosition.xyz;
}