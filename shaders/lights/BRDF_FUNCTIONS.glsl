vec3 fresnelSchlick (float cosTheta, vec3 F0){
    float f = pow(1.0 - cosTheta, 5.0);
    return f + F0 * (1.0 - f);
}
vec3 fresnelSchlickRoughness (float cosTheta, vec3 F0, float roughness){
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow (1.0 - cosTheta, 5.0);
}

vec3 computeSSR(){
    if (metallic < 0.05) return vec3(0.);
    vec3 worldNormal = normalFromDepth(gl_FragCoord.z, quadUV, scene_depth);
    vec3 reflected = normalize(reflect(normalize(viewSpacePosition), normalize(worldNormal)));
    vec3 hitPos = viewSpacePosition;
    vec3 jitt = mix(vec3(0.0), vec3(hash(viewSpacePosition)), roughness);
    float step = max(stepSizeSSR, .1);
    int maxSteps = min(100, max(1, maxStepsSSR));
    vec4 coords = RayMarch(maxSteps, (vec3(jitt) + reflected * max(.01, -viewSpacePosition.z)), hitPos, step, quadUV);

    vec2 dCoords = smoothstep(CLAMP_MIN, CLAMP_MAX, abs(vec2(0.5) - coords.xy));
    float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);

    float reflectionMultiplier = pow(metallic, SSRFalloff) * screenEdgefactor * -reflected.z;
    vec3 tracedAlbedo = texture(previousFrame, coords.xy).rgb;

    return tracedAlbedo * clamp(reflectionMultiplier, 0.0, 1.);
}

float distributionGGX (vec3 N, vec3 H, float roughness){
    float a2    = roughness * roughness * roughness * roughness;
    float NdotH = max (dot(N, H), 0.0);
    float denom = (NdotH * NdotH * (a2 - 1.0) + 1.0);
    return a2 / (PI * denom * denom);
}

float geometrySchlickGGX (float NdotV, float roughness){
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

float geometrySmith (float NdotL, float roughness){
    return geometrySchlickGGX (max (NdotL, 0.0), roughness) *
    geometrySchlickGGX (max (NdotV, 0.0), roughness);
}

vec3 sampleIndirectLight(){
    vec3 diffuseColor = texture(SSGI, quadUV).rgb * albedoOverPI;
    vec3 specularColor = ssrEnabled ? computeSSR() * (brdf.r + brdf.g) : vec3(0.);
    return diffuseColor + specularColor;
}

vec3 computeSkylightAmbient(vec3 V){
    vec3 specular = vec3(0.);
    vec3 F  = fresnelSchlickRoughness(NdotV, F0, roughness);
    vec3 kD = (1.0 - F) * (1.0 - metallic);
    vec3 prefilteredColor = textureLod(skylight_specular, reflect(-V, N), 0.).rgb;

    specular = prefilteredColor;//* (F * brdf.r + brdf.g);

    //    vec3 diffuse = texture(skylight_diffuse, N).rgb * albedo * kD ;
    return specular;//diffuse + specular;
}

vec4 precomputeContribution(vec3 lightPosition,vec3 N){
    vec3 L = normalize(lightPosition - worldSpacePosition);
    float NdotL = max(dot(N, L), 0.0);
    if (NdotL <= 0.) return vec4(0.);
    return vec4(L, NdotL);
}

vec3 computeBRDF (vec3 L, float NdotL, vec3 lightColor, vec3 V, vec3 N, float roughness, float metallic, vec3 F0) {
    vec3 H = normalize(V + L);


    float NDF = distributionGGX(N, H, roughness);
    float G   = geometrySmith(NdotL, roughness);
    vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

    vec3 kD = (1.0 - F) * (1.0 - metallic);

    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * max(NdotV, 0.0) * max(NdotL, 0.0) + 0.0001;
    vec3 specular = numerator / denominator;


    return vec3((kD * albedoOverPI + specular) * lightColor * NdotL);
}

