precision highp float;

in vec4 previousScreenPosition;
in vec4 currentScreenPosition;


layout (location = 0) out vec4 v_depth;
layout (location = 1) out vec4 v_entityid;
layout (location = 2) out vec4 v_velocity;

uniform vec3 entityID;

void main(){
    vec2 a = (currentScreenPosition.xy / currentScreenPosition.w) * 0.5 + 0.5;
    vec2 b = (previousScreenPosition.xy / previousScreenPosition.w) * 0.5 + 0.5;
    vec2 c = a - b;

    v_depth = vec4(gl_FragCoord.z, 0., 0., 1.);
    v_entityid = vec4(entityID, 1.);
    v_velocity = vec4(vec2(pow(c.x, 1.), pow(c.y, 1.)), 0., 1.);

}