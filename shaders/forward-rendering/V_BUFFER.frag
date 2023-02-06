precision highp float;

in vec4 previousScreenPosition;
in vec4 currentScreenPosition;
in mat4 entityMetadata;
in float depthFunc;

layout (location = 0) out float v_depth;
layout (location = 1) out vec4 v_entity;
layout (location = 2) out vec4 v_velocity;

float encode() {
    float half_co = depthFunc * 0.5;
    float clamp_z = max(0.000001, gl_FragCoord.z );
    return log2(clamp_z) * half_co;
}


void main() {
    vec2 a = (currentScreenPosition.xy / currentScreenPosition.w);
    vec2 b = (previousScreenPosition.xy / previousScreenPosition.w);
    v_velocity = vec4(abs(a - b), 0., 1.);
    v_entity = vec4(entityMetadata[0][0], entityMetadata[0][1], entityMetadata[0][2], 1.);


    if (entityMetadata[1][0] != 1.)
    v_depth = encode();
    else
    v_depth = 0.;
}