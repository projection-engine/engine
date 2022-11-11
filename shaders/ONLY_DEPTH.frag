#version 300 es
precision highp float;

in vec2 texCoords;
uniform vec3 meshID;
in vec3 normalVec;

in vec4 previousScreenPosition;
in vec4 currentScreenPosition;

layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedo;
layout (location = 3) out vec4 gBehaviour;// AO ROUGHNESS METALLIC
layout (location = 4) out vec4 gDepth;
layout (location = 5) out vec4 gMeshID;
layout (location = 6) out vec4 gBaseNormal;
layout (location = 7) out vec4 gVelocity;

void main(){
    vec2 a = (currentScreenPosition.xy / currentScreenPosition.w) * 0.5 + 0.5;
    vec2 b = (previousScreenPosition.xy / previousScreenPosition.w) * 0.5 + 0.5;
    vec2 c = a - b;
    gVelocity = vec4(pow(c.x, 3.), pow(c.y, 3.), 0., 1.);

    gPosition = vec4(0.);
    gNormal = vec4(0.);
    gAlbedo = vec4(0.);
    gBehaviour = vec4(0.);


    gBaseNormal = normalize(vec4(normalVec, 1.));
    gMeshID = vec4(meshID, 1.);
    gDepth = vec4(gl_FragCoord.z, texCoords, 1.);
}

