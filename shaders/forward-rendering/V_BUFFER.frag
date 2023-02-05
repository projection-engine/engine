precision highp float;

in vec4 previousScreenPosition;
in vec4 currentScreenPosition;
in mat4 entityMetadata;
in float depthFunc;
in float funcC;

layout (location = 0) out vec4 v_depth;
layout (location = 1) out vec4 v_entity;
layout (location = 2) out vec4 v_velocity;

void main() {
    vec2 a = (currentScreenPosition.xy / currentScreenPosition.w);
    vec2 b = (previousScreenPosition.xy / previousScreenPosition.w);
    v_velocity = vec4(abs(a - b) * .5 + .5, 0., 1.);
    v_entity = vec4(entityMetadata[0][0], entityMetadata[0][1], entityMetadata[0][2], 1.);

    v_depth = vec4(0., 0., 0., 0.);
    if (entityMetadata[1][0] != 1.) {
        v_depth.r = log(funcC * gl_FragCoord.z + 1.) / depthFunc;
        v_depth.a = 1.;
    }
}