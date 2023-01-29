vec3 gaussian(sampler2D samplerData, vec2 texCoords, float blurRadius, int samples, bool useDefaultTexel) {
    vec2 texel = useDefaultTexel ? bufferResolution : vec2(textureSize(samplerData, 0));
    return blur(samplerData, texCoords, texel, max(samples, 1), blurRadius);
}


vec3 computeSSR() {
    if (metallic < 0.05) return vec3(0.);
    vec3 worldNormal = normalFromDepth(depthData, quadUV);
    vec3 reflected = normalize(reflect(normalize(viewSpacePosition), normalize(worldNormal)));
    vec3 hitPos = viewSpacePosition;
    float step = max(stepSizeSSR, .1);
    int maxSteps = clamp(maxStepsSSR, 1, 100);
    vec4 coords = RayMarch(maxSteps, (reflected * max(.01, -viewSpacePosition.z)), hitPos, step, quadUV);

    vec2 dCoords = smoothstep(CLAMP_MIN, CLAMP_MAX, abs(vec2(0.5) - coords.xy));
    float screenEdgefactor = clamp(1.0 - (dCoords.x + dCoords.y), 0.0, 1.0);
    float reflectionMultiplier = clamp(pow(metallic, SSRFalloff) * screenEdgefactor * -reflected.z, 0., 1.);
    vec3 tracedAlbedo = gaussian(previousFrame, coords.xy, roughness * 10., 16, true);

    return tracedAlbedo * reflectionMultiplier * (brdf.r + brdf.g);
}

vec3 getDiffuse(vec3 KS, float metallic) {
    return (1. - KS) * (1. - metallic);
}
vec3 fresnelSchlick(float VdotH, vec3 F0) {
    float f = pow(1.0 - VdotH, 5.0);
    return f + F0 * (1.0 - f);
}


vec3 fresnel(vec3 F0, float F90, float HdotV) {
    return F0 + (F90 - F0) * pow(1.0 - HdotV, 5.0);
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

vec3 sampleIndirectLight() {
    vec3 diffuseColor = texture(SSGI, quadUV).rgb * albedo;
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

float kelemen(float HdotV) {
    return 1. / (4. * pow(HdotV, 2.) + 1e-5);
}

// "Production Friendly Microfacet Sheen BRDF" http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
float charlie(float roughness, float NdotH) {
    const float MAX_SIN2H = 0.0078125;

    float inv = 1.0 / max(roughness, .000001);
    float sin2h = max(1.0 - pow(NdotH, 2.), MAX_SIN2H);

    return (2. + inv) * pow(sin2h, inv * .5) / (2. * PI);
}

float GGXAnisotropicCosine2(float cos_theta_m, float alpha_x, float alpha_y, float cos_phi, float sin_phi)
{
    float cos2 = cos_theta_m * cos_theta_m;
    float sin2 = (1.0 - cos2);
    float s_x = alpha_x * cos_phi;
    float s_y = alpha_y * sin_phi;
    return 1.0 / max(cos_theta_m + sqrt(cos2 + (s_x * s_x + s_y * s_y) * sin2), 0.001);
}
float GGXAnisotropic(float cos_theta_m, float alpha_x, float alpha_y, float cos_phi, float sin_phi)
{
    float cos2 = cos_theta_m * cos_theta_m;
    float sin2 = (1.0 - cos2);
    float r_x = cos_phi / alpha_x;
    float r_y = sin_phi / alpha_y;
    float d = cos2 + sin2 * (r_x * r_x + r_y * r_y);
    return clamp(1.0 / (PI * alpha_x * alpha_y * d * d), 0., 1.);
}
void anisotropicCompute(inout vec3 H, inout vec3 dEnergy, inout vec3 specularTotal, inout vec3 L, float NdotL, inout vec3 lightColor, float HdotV, float NdotH) {
    vec3 b = normalize(B);
    float rotation = max(anisotropicRotation * PI * 2., .00000001);
    vec2 direction = vec2(cos(rotation), sin(rotation));
    vec3 t = normalize((vec3(direction, 0.) * TBN));

    float aspect = sqrt(1. - anisotropy * .9);
    float ax = roughness / aspect;
    float ay = roughness * aspect;
    float TdotH = dot(t, H);
    float BdotH = dot(b, H);

    float D = GGXAnisotropic(NdotH, ax, ay, TdotH, BdotH);
    float V = GGXAnisotropicCosine2(NdotV, ax, ay, TdotH, BdotH) * GGXAnisotropicCosine2(NdotV, ax, ay, TdotH, BdotH);
    vec3 F = fresnel(F0, clamp(dot(F0, vec3(50. * .3333)), 0., 1.), dot(L, H));

    specularTotal += D * V * F;
    dEnergy *= getDiffuse(F, metallic);
}

void clearCoatCompute(inout vec3 dEnergy, inout vec3 specularTotal, inout vec3 L, float NdotL, inout vec3 lightColor, float HdotV, float NdotH) {
    float D = distributionGGX(NdotH, roughness);
    float V = kelemen(HdotV);
    vec3 F = fresnel(vec3(.04), 1., HdotV) * max(clearCoat, 0.);
    specularTotal += D * V * F;
    dEnergy *= getDiffuse(F, metallic);

}
void sheenCompute(inout vec3 dEnergy, inout vec3 specularTotal, inout vec3 L, float NdotL, inout vec3 lightColor, float HdotV, float NdotH) {
    float D = charlie(roughness, NdotH);
    float V = clamp(1.0 / (4.0 * (NdotL + NdotV - NdotL * NdotV)), 0., 1.);
    vec3 F = sheen * mix(vec3(1.), F0, pow(sheenTint, 2.));
    specularTotal += D * V * F;
    dEnergy *= getDiffuse(F, metallic);
}

void isotropicCompute(inout vec3 dEnergy, inout vec3 specularTotal, inout vec3 L, float NdotL, inout vec3 lightColor, float HdotV, float NdotH) {
    float D = distributionGGX(NdotH, roughness);
    float V = geometrySmith(NdotL, roughness);
    vec3 F = fresnelSchlick(HdotV, F0);
    specularTotal += D * V * F;
    dEnergy *= getDiffuse(F, metallic);
}



vec3 computeBRDF(inout vec3 L, float NdotL, inout vec3 lightColor) {
    vec3 H = normalize(V + L);
    float HdotV = clamp(dot(H, V), 0., 1.);
    float NdotH = clamp(dot(N, H), 0., 1.);

    vec3 specularTotal = vec3(0.);
    vec3 diffuseEnergy = vec3(1.);


    switch (renderingMode) {
        case ISOTROPIC:
        case TRANSPARENCY:
            isotropicCompute(diffuseEnergy, specularTotal, L, NdotL, lightColor, HdotV, NdotH);
            break;
        case ANISOTROPIC:
            anisotropicCompute(H, diffuseEnergy, specularTotal, L, NdotL, lightColor, HdotV, NdotH);
            break;
        case SHEEN:
            sheenCompute(diffuseEnergy, specularTotal, L, NdotL, lightColor, HdotV, NdotH);
            break;
        case CLEAR_COAT:
            clearCoatCompute(diffuseEnergy, specularTotal, L, NdotL, lightColor, HdotV, NdotH);
            break;
    }

    return (albedoOverPI * diffuseEnergy + specularTotal) * lightColor * NdotL;
}

