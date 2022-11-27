precision highp float;

//import(uberAttributes)
//import(pbLightComputation)

void main(){
    quadUV = gl_FragCoord.xy/vec2(textureSize(scene_depth, 0));
    N = normalVec;
    fragColor = pbLightComputation();
}


