precision highp float;

//import(uberAttributes)
//import(pbLightComputation)

void main(){
    quadUV = gl_FragCoord.xy/buffer_resolution;
    N = normalVec;
    fragColor = pbLightComputation();
}


