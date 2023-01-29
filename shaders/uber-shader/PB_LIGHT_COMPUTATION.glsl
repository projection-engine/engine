vec3 processLight(mat4 primaryBuffer, mat4 secondaryBuffer ) {
    int type = int(primaryBuffer[0][0]);
    vec3 directIllumination = vec3(0.);
    if (type == DIRECTIONAL)
    directIllumination += computeDirectionalLight(primaryBuffer, secondaryBuffer);
    else if (type == POINT)
    directIllumination += computePointLights(primaryBuffer, secondaryBuffer);
    else if (type == SPOT)
    directIllumination += computeSpotLights(primaryBuffer, secondaryBuffer);
    else if (type == SPHERE)
    directIllumination += computeSphereLight(primaryBuffer, secondaryBuffer);
    else if (type == DISK)
    directIllumination += computeDiskLight(primaryBuffer, secondaryBuffer);
    return directIllumination;
}

vec4 pbLightComputation() {
    if (flatShading || isSky) return vec4(albedo + emission, 1.);
    VrN = reflect(-V, N);
    albedoOverPI = albedo / PI;
    vec3 directIllumination = vec3(0.0);
    vec3 indirectIllumination = vec3(0.0);
    float ao = hasAmbientOcclusion && distanceFromCamera < SSAOFalloff ? naturalAO * texture(SSAO, quadUV).r : naturalAO;
    if(renderingMode == ANISOTROPIC)
        computeTBN();
    NdotV = clamp(dot(N, V), 0., 1.);
    brdf = texture(brdf_sampler, vec2(NdotV, roughness)).rg;
    F0 = mix(F0, albedo, metallic);

    for (int i = 0; i < lightQuantity; i++) {
        directIllumination += processLight(
            lightPrimaryBuffer[i],
            lightSecondaryBuffer[i]
        );
    }

    indirectIllumination = sampleIndirectLight();

    return vec4((directIllumination + indirectIllumination) * ao + emission * albedo, alpha);

}

