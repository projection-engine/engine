// ------------------ ATTRIBUTES TO FILL
float naturalAO = 1.;
float roughness = .5;
float metallic = .5;
float refractionIndex=0.;
float alpha = 1.;
vec3 albedo= vec3(.5);
vec3 N = vec3(0.);
vec3 emission = vec3(0.);

vec3 albedoOverPI;
vec3 VrN;
// ------------------ ATTRIBUTES TO FILL


// ------------------ INTERNAL ATTRIBUTES

vec2 brdf = vec2(0.);
vec3 F0 = vec3(0.04);
float NdotV;
//import(depthReconstructionUtils)

//import(rayMarcher)

//import(SSS)

//import(brdf)

//import(computeLights)

//import(computePointLights)

//import(computeSpotLights)

//import(computeAreaLights)

vec3 processLight(mat4 primaryBuffer, mat4 secondaryBuffer, int type){
    vec3 directIllumination = vec3(0.);
    if (type == DIRECTIONAL)
    directIllumination += computeDirectionalLight(distanceFromCamera, secondaryBuffer, primaryBuffer, V, F0, 1., .0, N);
    else if (type == POINT)
    directIllumination += computePointLights(distanceFromCamera, shadow_cube, primaryBuffer, V, N, 1., .0, F0);
    else if (type == SPOT)
    directIllumination += computeSpotLights(primaryBuffer, V, N, 1., .0, F0);
    else if (type == SPHERE)
    directIllumination += computeSphereLight(primaryBuffer, V, N, roughness, metallic, F0);
    else if (type == DISK)
    directIllumination += computeDiskLight(primaryBuffer, V, N, roughness, metallic, F0);
    return directIllumination;
}

vec4 pbLightComputation() {
    if (flatShading || isSky) return vec4(albedo + emission, alpha);
    VrN		= reflect( -V, N );
    albedoOverPI = albedo/PI;
    vec3 directIllumination = vec3(0.0);
    vec3 indirectIllumination = vec3(0.0);
    float ao = hasAmbientOcclusion && distanceFromCamera < SSAOFalloff ? naturalAO * texture(SSAO, quadUV).r : naturalAO;

    NdotV = max(dot(N, V), 0.000001);
    brdf = texture(brdf_sampler, vec2(NdotV, roughness)).rg;
    F0 = mix(F0, albedo, metallic);

    for (int i = 0; i < lightQuantity; i++){
        directIllumination += processLight(
            lightPrimaryBuffer[i],
            lightSecondaryBuffer[i],
            lightTypeBuffer[i]
        );
    }



    indirectIllumination = sampleIndirectLight();
    return vec4((directIllumination + indirectIllumination) * ao + emission, alpha);

}

