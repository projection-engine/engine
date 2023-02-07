precision highp float;

in vec4 previousScreenPosition;
in vec4 currentScreenPosition;
in mat4 entityMetadata;
in float depthFunc;

layout (location = 0) out vec4 v_depth_velocity;
layout (location = 1) out vec4 v_entity;

float encode() {
    float half_co = depthFunc * 0.5;
    float clamp_z = max(0.000001, gl_FragCoord.z);
    return log2(clamp_z) * half_co;
}


void main() {
    v_depth_velocity = vec4(0., 0., 0., 1.);

    vec2 a = (currentScreenPosition.xy / currentScreenPosition.w);
    vec2 b = (previousScreenPosition.xy / previousScreenPosition.w);

    v_depth_velocity.gb = abs(a - b);
    v_entity = vec4(entityMetadata[0][0], entityMetadata[0][1], entityMetadata[0][2], 1.);

    if (entityMetadata[1][0] != 1.)
    v_depth_velocity.r = encode();
    else
    v_depth_velocity.r = 0.;
}