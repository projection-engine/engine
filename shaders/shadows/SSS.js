
export const sss=`
bool screenSpaceShadows(vec3 lightViewPos, vec3 pixelViewPos, int amountOfIterations){
    vec3 ray=lightViewPos-pixelViewPos;
    float oneStep = (ray/float(amountOfIterations)).r;
    vec3 viewPosition = pixelViewPos;
    for(int i=0;i<amountOfIterations;i++){
        viewPosition=viewPosition+oneStep;
        ssPosition=view_to_ss(viewPosition);
        depthValue=texture(depthSampler, ssPosition.xy);
        if(depthValue<ssPosition.z)
            return true;
    }
    return false;
}
`