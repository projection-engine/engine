//import(cameraProjectionInfo)
uniform sampler2D sceneDepth;

float getLogDepth(vec2 uv) {
    float half_co = logDepthFC * .5;
    float exponent = textureLod(sceneDepth, uv, 2.).r / half_co;
    return pow(2.0, exponent);
}

vec3 viewSpacePositionFromDepth(float logarithimicDepth, vec2 texCoords) {
    float z = logarithimicDepth * 2.0 - 1.0;

    vec4 clipSpacePosition = vec4(texCoords * 2.0 - 1.0, z, 1.0);
    vec4 viewSpacePosition = invProjectionMatrix * clipSpacePosition;
    viewSpacePosition /= viewSpacePosition.w;

    return viewSpacePosition.rgb;
}
vec3 normalFromDepth(float logarithimicDepth, vec2 texCoords) {
    vec2 texelSize = 1. / bufferResolution;
    vec2 texCoords1 = texCoords + vec2(0., 1.) * texelSize;
    vec2 texCoords2 = texCoords + vec2(1., 0.) * texelSize;

    float depth1 = getLogDepth(texCoords1);
    float depth2 = getLogDepth(texCoords2);

    vec3 P0 = viewSpacePositionFromDepth(logarithimicDepth, texCoords);
    vec3 P1 = viewSpacePositionFromDepth(depth1, texCoords1);
    vec3 P2 = viewSpacePositionFromDepth(depth2, texCoords2);

    return normalize(cross(P2 - P0, P1 - P0));
}