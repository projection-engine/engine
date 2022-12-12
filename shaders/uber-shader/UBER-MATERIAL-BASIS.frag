precision highp float;
#define FRAG_DEPTH_THRESHOLD .00001

//--UNIFORMS--

//import(uberAttributes)

//import(pbLightComputation)

void main(){

    quadUV = gl_FragCoord.xy/bufferResolution;
    if(!noDepthChecking){
        vec4 depthData = texture(scene_depth, quadUV);

        if (abs(depthData.r - gl_FragCoord.z) > FRAG_DEPTH_THRESHOLD || (isSky && depthData.r > 0.)) discard;
    }

    vec3 V = cameraPosition - worldSpacePosition;
    distanceFromCamera = length(V);
    V = normalize(V);

    //--MATERIAL_SELECTION--

    fragColor = pbLightComputation(V);
}


