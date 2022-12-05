precision highp float;
#define FRAG_DEPTH_THREASHOLD .00001

//--UNIFORMS--

//import(parallaxOcclusionMapping)

//import(uberAttributes)

//import(pbLightComputation)

void main(){

    quadUV = gl_FragCoord.xy/bufferResolution;
    if(!noDepthChecking){
        vec4 depthData = texture(scene_depth, quadUV);

        if (abs(depthData.r - gl_FragCoord.z) > FRAG_DEPTH_THREASHOLD || (isSky && depthData.r > 0.)) discard;
    }

    //--MATERIAL_SELECTION--

    fragColor = pbLightComputation();
}


