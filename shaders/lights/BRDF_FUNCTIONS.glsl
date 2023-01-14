vec3 getDiffuse(vec3 KS, float metallic) {
    return (1. - KS) * (1. - metallic);
}
vec3 fresnelSchlick(float VdotH, vec3 F0) {
    float f = pow(1.0 - VdotH, 5.0);
    return f + F0 * (1.0 - f);
}
vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(1.0 - cosTheta, 5.0);
}

float distributionGGX(float NdotH, float roughness) {
    float a2 = pow(roughness, 4.);
    float denom = (pow(NdotH, 2.) * (a2 - 1.0) + 1.0);
    return a2 / (PI * pow(denom, 2.));
}

float geometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

float geometrySmith(float NdotL, float roughness) {
    float roughnessSquared = pow(roughness, 2.);
    float V = NdotL * (NdotV * (1. - roughnessSquared) + roughnessSquared);
    float L = NdotV * (NdotL * (1. - roughnessSquared) + roughnessSquared);
    return clamp(0.5 * 1. / (V + L), 0., 1.);
}



vec3 gaussian(sampler2D samplerData, vec2 texCoords) {
    int blurRadius = int(roughness * 20.);
    float sigma = float(blurRadius) * 0.75;
    vec3 col = vec3(0.0);
    float accum = 0.0;
    float weight;
    vec2 offset;
    float SIG = 2.0 * pow(float(blurRadius), 2.);
    if (blurRadius <= 1)
    return texture(samplerData, texCoords).rgb;
    for (int x = -blurRadius / 2; x < blurRadius / 2; ++x) {
        for (int y = -blurRadius / 2; y < blurRadius / 2; ++y) {
            offset = vec2(x, y);
            weight = 1.0 / SIG * PI * exp(-((pow(offset.x, 2.) + pow(offset.y, 2.)) / SIG));
            col += textureLod(samplerData, texCoords + texelSize * offset, 2.).rgb * weight;
            accum += weight;
        }
    }

    if (accum > 0.) return col / accum;
    return texture(samplerData, texCoords).rgb;
}


vec3 computeSSR() {
    if (metallic < 0.05) return vec3(0.);
    vec3 worldNormal = normalFromDepth(depthData, quadUV, scene_depth);
    vec3 reflected = normalize(reflect(normalize(viewSpacePosition), normalize(worldNormal)));
    vec3 hitPos = viewSpacePosition;
    float step = max(stepSizeSSR, .1);
    int maxSteps = clamp(maxStepsSSR, 1, 100);
    vec4 coords = RayMarch(maxSteps, (reflected * max(.01, -viewSpacePosition.z)), hitPos, step, quadUV);

    vec2 dCoords = smoothstep(CLAMP_MIN, CLAMP_MAX, abs(vec2(0.5) - coords.xy));
    float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);
    float reflectionMultiplier = clamp(pow(metallic, SSRFalloff) * screenEdgefactor * -reflected.z, 0., 1.);
    vec3 tracedAlbedo = gaussian(previousFrame, coords.xy);

    return tracedAlbedo * reflectionMultiplier * (brdf.r + brdf.g);
}

vec3 sampleIndirectLight() {
    vec3 diffuseColor = texture(SSGI, quadUV).rgb * albedoOverPI;
    vec3 specularColor = ssrEnabled ? computeSSR() : vec3(0.);
    return diffuseColor + specularColor;
}

vec3 computeSkylightAmbient(vec3 V) {
    vec3 specular = vec3(0.);
    vec3 F = fresnelSchlickRoughness(NdotV, F0, roughness);
    vec3 kD = (1.0 - F) * (1.0 - metallic);
    vec3 prefilteredColor = textureLod(skylight_specular, reflect(-V, N), 0.).rgb;

    specular = prefilteredColor;//* (F * brdf.r + brdf.g);

    //    vec3 diffuse = texture(skylight_diffuse, N).rgb * albedo * kD ;
    return specular;//diffuse + specular;
}

vec4 precomputeContribution(vec3 lightPosition) {
    vec3 L = normalize(lightPosition - worldSpacePosition);
    float NdotL = max(dot(N, L), 0.0);
    if (NdotL <= 0.) return vec4(0.);
    return vec4(L, NdotL);
}

vec3 computeBRDF(vec3 L, float NdotL, vec3 lightColor) {
    vec3 H = normalize(V + L);
    float HdotV = clamp(dot(H, V), 0., 1.);
    float NdotH = clamp(dot(N, H), 0., 1.);

    float D = distributionGGX(NdotH, roughness);
    float S = geometrySmith(NdotL, roughness);
    vec3 F = fresnelSchlick(HdotV, F0);

    return clamp(vec3((getDiffuse(F, metallic) * albedoOverPI + D * F * S) * lightColor * NdotL), 0., 1.);
}

