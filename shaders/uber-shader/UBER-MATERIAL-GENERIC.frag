
precision highp float;
#define PI 3.14159265359

in vec2 texCoords;
in vec3 normalVec;
in vec3 worldSpacePosition;

uniform float elapsedTime;
uniform int materialID;

mat3 TBN;

out vec4 fragColor;

//import(pbLightComputation)

void main(){
    N = normalVec;
    pbLightComputation(fragColor);
}


