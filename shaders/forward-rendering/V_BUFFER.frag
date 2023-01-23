precision highp float;

in vec4 previousScreenPosition;
in vec4 currentScreenPosition;
in mat4 entityMetadata;

layout (location = 0) out vec4 v_depth;
layout (location = 1) out vec4 v_entity;
layout (location = 2) out vec4 v_velocity;
void main() {
    vec2 a = (currentScreenPosition.xy / currentScreenPosition.w) * 0.5 + 0.5;
    vec2 b = (previousScreenPosition.xy / previousScreenPosition.w) * 0.5 + 0.5;
    vec2 c = abs(a - b);

    if (entityMetadata[1][0] != 1.)
    v_depth = vec4(gl_FragCoord.z, 0., 0., 0.);
    v_velocity = vec4(pow(c.x, 1.), pow(c.y, 1.), 0., 1.);
    v_entity = vec4(entityMetadata[0][0], entityMetadata[0][1], 0., 1.);
}