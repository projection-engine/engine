// ------------------ ATTRIBUTES TO FILL
float naturalAO = 1.;
float roughness = .5;
float metallic = .5;
float refractionIndex=0.;
float alpha = 1.;
vec3 albedo= vec3(.5);
vec3 N = vec3(0.);
vec3 emission = vec3(0.);
bool flatShading = false;
vec3 albedoOverPI;
// ------------------ ATTRIBUTES TO FILL


// ------------------ INTERNAL ATTRIBUTES

vec2 brdf = vec2(0.);
vec3 F0 = vec3(0.04);
float NdotV;
vec3 viewSpacePosition;
//import(depthReconstructionUtils)

//import(rayMarcher)

//import(SSS)

//import(brdf)

//import(computeLights)

//import(computePointLights)

//import(computeSpotLights)

vec3 computeSkylightAmbient(vec3 V){
    vec3 specular = vec3(0.);
    vec3 F  = fresnelSchlickRoughness(NdotV, F0, roughness);
    vec3 kD = (1.0 - F) * (1.0 - metallic);
    vec3 prefilteredColor = textureLod(skylight_specular, reflect(-V, N), 0.).rgb;

    specular = prefilteredColor;//* (F * brdf.r + brdf.g);

    //    vec3 diffuse = texture(skylight_diffuse, N).rgb * albedo * kD ;
    return specular;//diffuse + specular;
}

//vec3 computeSphereLight(vec3 lightPosition, vec3 lightColor, vec3 V, vec3 N, float roughness, float metallic,  vec3 F0){
//    vec3 L = lightPosition - worldSpacePosition;
//    vec3 R = reflect(-V, N);
//    vec3 centerToRay = dot(L, R) * R - L;
//    vec3 closestPoint = L + centerToRay * clamp(sphereRadius / length(centerToRay), 0., 1.);
//    vec3 newLightVector = closestPoint - worldSpacePosition;
//    return computeBRDF(newLightVector, lightColor, V, N, roughness, metallic, F0);
//}


vec4 pbLightComputation(vec3 V) {
    if (flatShading) return vec4(albedo + emission, alpha);
    viewSpacePosition = viewSpacePositionFromDepth(gl_FragCoord.z, quadUV);
    albedoOverPI = albedo/PI;
    vec3 directIllumination = vec3(0.0);
    vec3 indirectIllumination = vec3(0.0);
    float ao = hasAmbientOcclusion && distanceFromCamera < SSAOFalloff ? naturalAO * texture(SSAO, quadUV).r : naturalAO;
    float NdotV = max(dot(N, V), 0.000001);
    brdf = texture(brdf_sampler, vec2(NdotV, roughness)).rg;
    F0 = mix(F0, albedo, metallic);

    for (int i = 0; i < lightQuantityA; i++){
        mat4 primaryBuffer= lightPrimaryBufferA[i];
        mat4 secondaryBuffer = lightSecondaryBufferA[i];
        int type = lightTypeBufferA[i];
        if (type == DIRECTIONAL)
        directIllumination += computeDirectionalLight(distanceFromCamera, secondaryBuffer, primaryBuffer, V, F0, 1., .0, N);
        else if (type == POINT)
        directIllumination += computePointLights(distanceFromCamera, shadow_cube, primaryBuffer, worldSpacePosition, V, N, 1., .0, F0);
        else
        directIllumination += computeSpotLights(distanceFromCamera, primaryBuffer, worldSpacePosition, V, N, 1., .0, F0);
    }

    //    directIllumination += computeSphereLight(sLightPos, vec3(1.), V, N, roughness, metallic, F0);

    indirectIllumination = sampleIndirectLight();
    if (hasSkylight)
    indirectIllumination += computeSkylightAmbient(V);
    return vec4((directIllumination + indirectIllumination) * ao + emission, alpha);

}

