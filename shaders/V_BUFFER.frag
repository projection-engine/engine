precision highp float;

in vec3 normalVec;
in vec4 viewSpacePosition;
in vec2 texCoords;

layout (location = 0) out vec4 v_position;
layout (location = 1) out vec4 v_normal;
layout (location = 2) out vec4 v_entityID;
layout (location = 3) out vec4 v_uv;

uniform vec3 entityID;
uniform int materialID;

void main(){
    v_position = vec4(viewSpacePosition.rgb, 1.);
    v_normal = vec4(normalVec, 1.);
    v_uv = vec4(texCoords, float(materialID)/255., 1.);
    v_entityID = vec4(entityID, 1.);
}