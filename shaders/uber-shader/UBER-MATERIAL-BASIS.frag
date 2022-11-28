precision highp float;
#define FRAG_DEPTH_THREASHOLD .00001

//--UNIFORMS--

//import(uberAttributes)

uniform sampler2D sampler0;
uniform sampler2D sampler1;
//uniform sampler2D sampler2;
//uniform sampler2D sampler3;
//uniform sampler2D sampler4;
//uniform sampler2D sampler5;
//uniform sampler2D sampler6;

//import(pbLightComputation)

void main(){

    quadUV = gl_FragCoord.xy/buffer_resolution;
    if(!noDepthChecking){
        vec4 depthData = texture(scene_depth, quadUV);
        if (abs(depthData.r - gl_FragCoord.z) > FRAG_DEPTH_THREASHOLD) discard;
    }

    //--MATERIAL_SELECTION--

    fragColor = pbLightComputation();
}


