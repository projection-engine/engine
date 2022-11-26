precision highp float;

//--UNIFORMS--

//import(uberAttributes)

//uniform sampler2D sampler0;
//uniform sampler2D sampler1;
//uniform sampler2D sampler2;
//uniform sampler2D sampler3;
//uniform sampler2D sampler4;
//uniform sampler2D sampler5;
//uniform sampler2D sampler6;

//import(pbLightComputation)

void main(){

    quadUV = gl_FragCoord.xy/vec2(textureSize(scene_depth, 0));
    if(!isAlphaTested){
        vec4 depthData = texture(scene_depth, quadUV);
        if (depthData.a < 1.) discard;
    }

    computeTBN();

    //--MATERIAL_SELECTION--

    fragColor = pbLightComputation();
}


