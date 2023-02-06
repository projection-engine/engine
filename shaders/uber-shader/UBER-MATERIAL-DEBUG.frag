precision highp float;
uniform int shadingModel;

//import(uberAttributes)

//--UNIFORMS--


const int ALBEDO = 0;
const int NORMAL = 1;
const int TANGENT = 2;
const int DEPTH = 3;
const int AO = 4;
const int DETAIL = 5;
const int LIGHT_ONLY = 6;
const int METALLIC = 7;
const int ROUGHNESS = 8;
const int G_AO = 9;
const int AMBIENT = 10;
const int POSITION = 11;
const int UV = 12;
const int RANDOM = 13;
const int OVERDRAW = 14;
const int LIGHT_COMPLEXITY = 15;
const int LIGHT_QUANTITY = 16;


float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 randomColor(float seed) {
    float r = rand(vec2(seed));
    float g = rand(vec2(seed + r));
    return vec3(
        r,
        g,
        rand(vec2(seed + g))
    );
}
bool checkDither() {
    if (screenDoorEffect) {
        vec2 a = floor(gl_FragCoord.xy);
        bool checker = mod(a.x + a.y, 2.) > 0.0;
        return checker;
    }
    return false;
}

bool checkLight(mat4 primaryBuffer, mat4 secondaryBuffer) {
    int type = int(primaryBuffer[0][0]);
    vec3 directIllumination = vec3(0.);
    if (type == DIRECTIONAL)
    directIllumination = computeDirectionalLight(primaryBuffer, secondaryBuffer);
    else if (type == POINT)
    directIllumination = computePointLights(primaryBuffer, secondaryBuffer);
    else if (type == SPOT)
    directIllumination = computeSpotLights(primaryBuffer, secondaryBuffer);
    else if (type == SPHERE)
    directIllumination = computeSphereLight(primaryBuffer, secondaryBuffer);
    else if (type == DISK)
    directIllumination = computeDiskLight(primaryBuffer, secondaryBuffer);

    return length(directIllumination) > 0.;
}
void main() {
    extractData();
    if (checkDither()) discard;
    if (isDecalPass) {
        if (depthData == 0.) discard;

        viewSpacePosition = viewSpacePositionFromDepth(depthData, quadUV);
        normalVec = normalize(vec3(invViewMatrix * vec4(normalFromDepth(depthData, quadUV), 0.)));
        worldSpacePosition = vec3(invViewMatrix * vec4(viewSpacePosition, 1.));
        vec3 objectSpacePosition = vec3(invModelMatrix * vec4(worldSpacePosition, 1.));
        texCoords = objectSpacePosition.xz * .5 + .5;

        bool inRange =
        objectSpacePosition.x >= -DECAL_DEPTH_THRESHOLD &&
        objectSpacePosition.x <= DECAL_DEPTH_THRESHOLD &&

        objectSpacePosition.y >= -DECAL_DEPTH_THRESHOLD &&
        objectSpacePosition.y <= DECAL_DEPTH_THRESHOLD &&

        objectSpacePosition.z >= -DECAL_DEPTH_THRESHOLD &&
        objectSpacePosition.z <= DECAL_DEPTH_THRESHOLD;

        if (!inRange) discard;
    } else {
        normalVec = naturalNormal;
        viewSpacePosition = viewSpacePositionFromDepth(gl_FragCoord.z, quadUV);
        worldSpacePosition = worldPosition;
        texCoords = naturalTextureUV;
        if (shadingModel == DETAIL || shadingModel == LIGHT_ONLY)
        if (!alphaTested && ((!isSky && !screenDoorEffect && abs(depthData - gl_FragCoord.z) > FRAG_DEPTH_THRESHOLD) || (isSky && depthData > 0.))) discard;
    }
    V = cameraPosition - worldSpacePosition;
    distanceFromCamera = length(V);
    V = normalize(V);

    //--MATERIAL_SELECTION--

    if (shadingModel == LIGHT_ONLY)
    albedo = vec3(1.);

    if (shadingModel == DETAIL || shadingModel == LIGHT_ONLY)
    fragColor = pbLightComputation();
    else {
        switch (shadingModel) {
            case ALBEDO:
                fragColor = vec4(albedo, 1.);
                break;
            case NORMAL:
                fragColor = vec4(N, 1.);
                break;
            case DEPTH:
                fragColor = vec4(vec3(depthData), 1.);
                break;
            case G_AO:
                fragColor = vec4(vec3(naturalAO), 1.);
                break;
            case METALLIC:
                fragColor = vec4(vec3(metallic), 1.);
                break;
            case ROUGHNESS:
                fragColor = vec4(vec3(roughness), 1.);
                break;
            case AO:

                fragColor = vec4(vec3(hasAmbientOcclusion ? texture(SSAO, quadUV).r : 1.), 1.);
                break;
            case POSITION:
                fragColor = vec4(vec3(worldSpacePosition), 1.);
                break;
            case UV:
                fragColor = vec4(texCoords, 0., 1.);
                break;
            case RANDOM:
                fragColor = vec4(randomColor(length(entityID)), 1.);
                break;
            case LIGHT_QUANTITY:
            case LIGHT_COMPLEXITY:{
                    bool isLightQuantity = shadingModel == LIGHT_QUANTITY;
                    float total = isLightQuantity ? float(lightQuantity) : float(MAX_LIGHTS * 3);
                    float contribution = 0.;

                    if (!flatShading) {
                        viewSpacePosition = viewSpacePositionFromDepth(depthData, quadUV);
                        albedoOverPI = vec3(1.);
                        F0 = mix(F0, albedoOverPI, 0.);

                        for (int i = 0; i < lightQuantity; i++) {
                            if (checkLight(
                                lightPrimaryBuffer[i],
                                lightSecondaryBuffer[i]
                            )) contribution++;
                        }

                    }
                    if (total > 0.)
                    fragColor = vec4(mix(vec3(1., 0., 0.), vec3(0., .0, 1.), 1. - contribution / total), 1.);
                    else
                    fragColor = vec4(0., 0., 1., 1.);
                    break;
                }
            case OVERDRAW:{
                    vec2 a = floor(gl_FragCoord.xy);
                    float checkerVal = 4.;

                    if (!alphaTested && abs(depthData - gl_FragCoord.z) > FRAG_DEPTH_THRESHOLD) {
                        fragColor = vec4(1., 0., 0., 1.);
                        checkerVal = 2.;
                    }
                    else
                    fragColor = vec4(0., 0., 1., 1.);

                    bool checker = mod(a.x + a.y, checkerVal) > 0.0;
                    if (checker) discard;


                    break;
                }
        }
    }
}


