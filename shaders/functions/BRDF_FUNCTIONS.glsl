vec3 fresnelSchlick (float cosTheta, vec3 F0){
    float f = pow(1.0 - cosTheta, 5.0);
    return f + F0 * (1.0 - f);
}
vec3 fresnelSchlickRoughness (float cosTheta, vec3 F0, float roughness){
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow (1.0 - cosTheta, 5.0);
}
vec3 sampleIndirectLight(bool ssrEnabled, float metallic, float roughness){
    vec3 diffuseColor = texture(SSGI, quadUV).rgb;

    vec3 specularColor = ssrEnabled ? computeSSR() : vec3(0.);

    if (length(diffuseColor) > 0. || length(specularColor) > 0.){
        vec3 F  = fresnelSchlickRoughness(NdotV, F0, roughness);
        vec3 kD = (1.0 - F) * (1.0 - metallic);
        diffuseColor *= albedoOverPI * kD;
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

vec3 computeBRDF (vec3 lightPosition, vec3 lightColor, vec3 V, vec3 N, float roughness, float metallic, vec3 F0) {
    float distanceFromFrag = length(lightPosition - worldSpacePosition);
    vec3 L = normalize(lightPosition - worldSpacePosition);
    vec3 H = normalize(V + L);

    float NDF = distributionGGX(N, H, roughness);
    float G   = geometrySmith(N, V, L, roughness);
    vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

    vec3 kD = (1.0 - F) * (1.0 - metallic);

    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
    vec3 specular = numerator / denominator;
    float NdotL = max(dot(N, L), 0.0);

    return vec3((kD * albedoOverPI + specular) * lightColor * NdotL);
}

