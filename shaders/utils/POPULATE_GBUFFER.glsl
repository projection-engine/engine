in vec3 normalVec;
in vec3 camera;
in vec3 worldSpacePosition;
in vec3 viewSpacePosition;
in vec2 texCoords;
in vec4 previousScreenPosition;
in vec4 currentScreenPosition;

layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedo;
layout (location = 3) out vec4 gBehaviour;
layout (location = 4) out vec4 gMeshID;
layout (location = 5) out vec4 gBaseNormal;
layout (location = 6) out vec4 gVelocity;

uniform vec3 meshID;

vec3 albedoData = vec3(0.);
vec3 normalData = vec3(0.);
vec3 behaviourData = vec3(0.);

void populateGBuffer(){
    vec2 a = (currentScreenPosition.xy / currentScreenPosition.w) * 0.5 + 0.5;
    vec2 b = (previousScreenPosition.xy / previousScreenPosition.w) * 0.5 + 0.5;
    vec2 c = a - b;

    gPosition = vec4(viewSpacePosition, 1.);
    gNormal = vec4(normalData, 1.);
    gAlbedo = vec4(albedoData, 1.);
    gBehaviour = vec4(behaviourData, 1.);
    gMeshID = vec4(meshID, 1.);
    gBaseNormal = vec4(normalVec, 1.);
    gVelocity = vec4(vec2(pow(c.x, 3.), pow(c.y, 3.)), 0., 1.);
}