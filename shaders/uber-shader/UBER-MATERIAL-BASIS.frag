precision highp float;
#define PI 3.14159265359

in vec2 texCoords;
in vec3 normalVec;
in vec3 worldSpacePosition;

uniform sampler2D SSAO;
uniform sampler2D SSGI;
uniform sampler2D SSR;
uniform sampler2D shadow_atlas;
uniform sampler2D shadow_cube;
uniform sampler2D previous_frame;

uniform float elapsedTime;
uniform int materialID;

//--UNIFORMS--

//--FUNCTIONS--

//--MATERIALS--

void main(){
    //--MATERIAL_SELECTION--
}


