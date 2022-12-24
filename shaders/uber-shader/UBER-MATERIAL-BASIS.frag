precision highp float;

//--UNIFORMS--

//import(uberAttributes)

//import(pbLightComputation)
bool checkDither(){
    if (screenDoorEffect){
        vec2 a = floor(gl_FragCoord.xy);
        bool checker = mod(a.x + a.y, 2.) > 0.0;
        return checker;
    }
    return false;
}
void main(){
    if(checkDither()) discard;
    quadUV = gl_FragCoord.xy/bufferResolution;
    if(!noDepthChecking){
        vec4 depthData = texture(scene_depth, quadUV);
        if (abs(depthData.r - gl_FragCoord.z) > FRAG_DEPTH_THRESHOLD || (isSky && depthData.r > 0.)) discard;
    }

    V = cameraPosition - worldSpacePosition;
    distanceFromCamera = length(V);
    V = normalize(V);

    //--MATERIAL_SELECTION--

    fragColor = pbLightComputation();
}


