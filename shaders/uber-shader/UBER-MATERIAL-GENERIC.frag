precision highp float;

//import(uberAttributes)
//import(pbLightComputation)

void main(){
    quadUV = gl_FragCoord.xy/vec2(textureSize(scene_depth, 0));
    vec4 depthData = texture(scene_depth, quadUV);
    if(depthData.a < 1.) discard;
    N = normalVec;
    fragColor = pbLightComputation();
}


