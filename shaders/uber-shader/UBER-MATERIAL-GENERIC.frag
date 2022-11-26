precision highp float;
#define PI 3.14159265359

in vec3 cameraPosition;
in vec2 texCoords;
in vec3 normalVec;
in vec3 worldSpacePosition;

uniform bool hasAmbientOcclusion;
uniform float elapsedTime;
uniform int materialID;

uniform sampler2D scene_depth;
out vec4 fragColor;

mat3 TBN;
vec2 quadUV;

//import(pbLightComputation)

void main(){
    quadUV = gl_FragCoord.xy/vec2(textureSize(scene_depth, 0));
    vec4 depthData = texture(scene_depth, quadUV);
    if(depthData.a < 1.) discard;
    N = normalVec;
    fragColor = pbLightComputation();
}


