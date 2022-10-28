#version 300 es
precision highp float;

in vec2 texCoords;
uniform vec3 meshID;
in vec3 normalVec;

layout (location = 0) out vec4 gPosition;
layout (location = 1) out vec4 gNormal;
layout (location = 2) out vec4 gAlbedo;
layout (location = 3) out vec4 gBehaviour;
layout (location = 4) out vec4 gAmbient;

layout (location = 5) out vec4 gDepth;
layout (location = 6) out vec4 gMeshID;
layout (location = 7) out vec4 gBaseNormal;

void main(){

    gPosition = vec4(0.);
    gNormal = vec4(0.);
    gAlbedo = vec4(0.);
    gBehaviour = vec4(0.);
    gAmbient = vec4(0.);


    gBaseNormal = normalize(vec4(normalVec, 1.));
    gMeshID = vec4(meshID, 1.);
    gDepth = vec4(gl_FragCoord.z, texCoords, 1.);
}

