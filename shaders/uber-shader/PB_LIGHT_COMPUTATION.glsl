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
// ------------------ ATTRIBUTES TO FILL


// ------------------ INTERNAL ATTRIBUTES
vec2 brdf = vec2(0.);
vec3 F0 = vec3(0.04);
float NdotV;

//import(depthReconstructionUtils)

//import(rayMarcher)

vec3 computeSSR(){
    if (metallic < 0.01)return vec3(0.);
    int maxSteps = int(rayMarchSettings.x);
    float falloff = rayMarchSettings.y;
    float minRayStep = rayMarchSettings.z;
    float stepSize = rayMarchSettings.w;

    vec3 viewPos = getViewPosition(quadUV);
    vec3 jitt = mix(vec3(0.0), vec3(hash(viewPos)), roughness);
    vec3 reflected = normalize(reflect(normalize(viewPos), normalize(normalVec)));

    vec3 hitPos = viewPos;
    float dDepth;

    vec4 coords = RayMarch(maxSteps, (reflected * max(minRayStep, -viewPos.z)), hitPos, dDepth, stepSize);

    vec2 dCoords = smoothstep(CLAMP_MIN, CLAMP_MAX, abs(vec2(0.5) - coords.xy));
    float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);
    float reflectionMultiplier =   pow(metallic, falloff) * screenEdgefactor * -reflected.z;
    vec3 tracedAlbedo = texture(previousFrame, coords.xy).rgb;

    return tracedAlbedo * clamp(reflectionMultiplier, 0.0, 1.);
}

vec3 fresnelSchlick (float cosTheta, vec3 F0, float roughness){
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow (1.0 - cosTheta, 5.0);
}

vec3 sampleIndirectLight(float shadowValue, float metallic, float roughness, vec3 albedo){
    vec3 diffuseColor = texture(SSGI, quadUV).rgb;

    vec3 specularColor = ssrEnabled ? computeSSR() * shadowValue : vec3(0.);

    if (length(diffuseColor) > 0. || length(specularColor) > 0.){
        vec3 F  = fresnelSchlick(NdotV, F0, roughness);
        vec3 kD = (1.0 - F) * (1.0 - metallic);
        diffuseColor *= albedo * kD;
        specularColor *=  (F * brdf.r + brdf.g);
    }

    return diffuseColor + specularColor;
}

float distributionGGX (vec3 N, vec3 H, float roughness){
    float a2    = roughness * roughness * roughness * roughness;
    float NdotH = max (dot (N, H), 0.0);
    float denom = (NdotH * NdotH * (a2 - 1.0) + 1.0);
    return a2 / (PI * denom * denom);
}

float geometrySchlickGGX (float NdotV, float roughness){
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

float geometrySmith (vec3 N, vec3 V, vec3 L, float roughness){
    return geometrySchlickGGX (max (dot (N, L), 0.0), roughness) *
    geometrySchlickGGX (max (dot (N, V), 0.0), roughness);
}

//import(computeLights)

vec3 computeSkylightAmbient(vec3 V){
    vec3 specular = vec3(0.);
    vec3 F  = fresnelSchlick(NdotV, F0, roughness);
    vec3 kD = (1.0 - F) * (1.0 - metallic);
    vec3 prefilteredColor = textureLod(skylight_specular, reflect(-V, N), 0.).rgb;

    specular = prefilteredColor ;//* (F * brdf.r + brdf.g);

//    vec3 diffuse = texture(skylight_diffuse, N).rgb * albedo * kD ;
    return specular;//diffuse + specular;
}


vec4 pbLightComputation() {
    if (flatShading) return vec4(albedo + emission, alpha);
    vec3 directIllumination = vec3(0.0);
    vec3 indirectIllumination = vec3(0.0);
    vec3 V = cameraPosition - worldSpacePosition;
    float distanceFromCamera = length(V);
    V = normalize(V);
    float ao = hasAmbientOcclusion ? naturalAO * texture(SSAO, quadUV).r : naturalAO;
    float NdotV = max(dot(N, V), 0.000001);
    brdf = texture(brdf_sampler, vec2(NdotV, roughness)).rg;
    F0 = mix(F0, albedo, metallic);

    float shadows = directionalLightsQuantity > 0 || pointLightsQuantity > 0?  0. : 1.0;
    float quantityToDivide = float(directionalLightsQuantity) + float(pointLightsQuantity);
    for (int i = 0; i < directionalLightsQuantity; i++){
        vec4 lightInformation = computeDirectionalLight(distanceFromCamera, shadow_atlas, shadowMapsQuantity, shadowMapResolution, directionalLightsPOV[i], directionalLights[i], worldSpacePosition, V, F0, roughness, metallic, N, albedo);
        directIllumination += lightInformation.rgb;
        shadows += lightInformation.a/quantityToDivide;
    }

    float viewDistance = length(V);
    for (int i = 0; i < int(pointLightsQuantity); ++i){
        vec4 lightInformation = computePointLights(distanceFromCamera, shadow_cube, pointLights[i], worldSpacePosition, viewDistance, V, N, quantityToDivide, roughness, metallic, albedo, F0);
        directIllumination += lightInformation.rgb;
        shadows += lightInformation.a/quantityToDivide;
    }

    indirectIllumination = sampleIndirectLight(shadows, metallic, roughness, albedo);
    if(hasSkylight)
        indirectIllumination += computeSkylightAmbient(V);
    return vec4((directIllumination * shadows + indirectIllumination) * ao + emission, alpha);

}

