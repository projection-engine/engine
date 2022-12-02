precision highp float;
#define FRAG_DEPTH_THREASHOLD .0001

//--UNIFORMS--

//import(parallaxOcclusionMapping)

//import(uberAttributes)

uniform int shadingModel;
uniform vec3 entityID;

//import(pbLightComputation)
const int ALBEDO =  0;
const int NORMAL =  1;
const int TANGENT =  2;
const int DEPTH =  3;
const int AO =  4;
const int DETAIL =  5;
const int LIGHT_ONLY =  6;
const int METALLIC =  7;
const int ROUGHNESS =  8;
const int G_AO =  9;
const int AMBIENT = 10;
const int POSITION = 11;
const int UV = 12;
const int RANDOM = 13;
const int OVERDRAW =  14;

float linearize(float depth){
    float near = .1;
    float far = 1000.;
    return (2. * near) / (far + near - depth*(far -near));
}

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 randomColor(float seed){
    float r = rand(vec2(seed));
    float g = rand(vec2(seed + r));
    return vec3(
    r,
    g,
    rand(vec2(seed + g))
    );
}


void main(){

    quadUV = gl_FragCoord.xy/buffer_resolution;
    vec4 depthData = texture(scene_depth, quadUV);
    if (shadingModel != OVERDRAW)
        if (!noDepthChecking && abs(depthData.r - gl_FragCoord.z) > FRAG_DEPTH_THREASHOLD) discard;

    //--MATERIAL_SELECTION--

    if(shadingModel == LIGHT_ONLY)
        albedo = vec3(.5);

    if (shadingModel == DETAIL || shadingModel == LIGHT_ONLY)
    fragColor = pbLightComputation();
    else {
        switch (shadingModel){
            case ALBEDO:
            fragColor = vec4(albedo, 1.);
            break;
            case NORMAL:
            fragColor = vec4(N, 1.);
            break;
            case DEPTH:
            fragColor = vec4(vec3(linearize(depthData.r)), 1.);
            break;
            case G_AO:
            fragColor = vec4(vec3(naturalAO), 1.);
            break;
            case METALLIC:
            fragColor = vec4(vec3(metallic), 1.);
            break;
            case ROUGHNESS:
            fragColor = vec4(vec3(roughness), 1.);
            break;
            case AO:
            fragColor = vec4(vec3(texture(SSAO, quadUV).r), 1.);
            break;
            case POSITION:
            fragColor = vec4(vec3(worldSpacePosition), 1.);
            break;
            case UV:
            fragColor = vec4(texCoords, 0., 1.);
            break;
            case RANDOM:
            fragColor = vec4(randomColor(length(entityID)), 1.);
            break;
            case OVERDRAW:
            if(!noDepthChecking && abs(depthData.r - gl_FragCoord.z) > FRAG_DEPTH_THREASHOLD)
                fragColor = vec4(1., 0., 0., .75);
            else
                fragColor = vec4(0., 0., 1., .3);
            break;
        }
    }
}


