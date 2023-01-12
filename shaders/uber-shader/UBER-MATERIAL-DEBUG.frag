precision highp float;

//import(uberAttributes)

uniform int shadingModel;

//--UNIFORMS--

//import(pbLightComputation)

const int ALBEDO =  0;
const int NORMAL =  1;
const int TANGENT =  2;
const int DEPTH =  3;
const int AO =  4;
const int DETAIL =  5;
const int LIGHT_ONLY =  6;
const int METALLIC =  7;
const int ROUGHNESS =  8;
const int G_AO =  9;
const int AMBIENT = 10;
const int POSITION = 11;
const int UV = 12;
const int RANDOM = 13;
const int OVERDRAW =  14;
const int LIGHT_COMPLEXITY = 15;
const int LIGHT_QUANTITY = 16;

float linearize(float depth){
    float near = .1;
    float far = 1000.;
    return (2. * near) / (far + near - depth*(far -near));
}

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 randomColor(float seed){
    float r = rand(vec2(seed));
    float g = rand(vec2(seed + r));
    return vec3(
    r,
    g,
    rand(vec2(seed + g))
    );
}
bool checkDither(){
    if (screenDoorEffect){
        vec2 a = floor(gl_FragCoord.xy);
        bool checker = mod(a.x + a.y, 2.) > 0.0;
        return checker;
    }
    return false;
}

bool checkLight(mat4 primaryBuffer, mat4 secondaryBuffer, int type){
    vec3 directIllumination = vec3(0.);
    if (type == DIRECTIONAL)
    directIllumination = computeDirectionalLight(distanceFromCamera, secondaryBuffer, primaryBuffer, V, F0, 1., .0, N);
    else if (type == POINT)
    directIllumination = computePointLights(distanceFromCamera, shadow_cube, primaryBuffer, V, N, 1., .0, F0);
    else if (type == SPOT)
    directIllumination = computeSpotLights(primaryBuffer, V, N, 1., .0, F0);
    else if (type == SPHERE)
    directIllumination = computeSphereLight(primaryBuffer, V, N, roughness, metallic, F0);
    else if (type == DISK)
    directIllumination = computeDiskLight(primaryBuffer, V, N, roughness, metallic, F0);

    return length(directIllumination) > 0.;
}
void main(){
    extractData();
    if(checkDither()) discard;
    quadUV = gl_FragCoord.xy/bufferResolution;
    vec4 depthData = texture(scene_depth, quadUV);
    if (shadingModel == DETAIL|| shadingModel == LIGHT_ONLY)
    if ((!isSky && !noDepthChecking && !screenDoorEffect &&  abs(depthData.r - gl_FragCoord.z) > FRAG_DEPTH_THRESHOLD) || (isSky && depthData.r > 0.)) discard;

    V = cameraPosition - worldSpacePosition;
    distanceFromCamera = length(V);
    V = normalize(V);

    //--MATERIAL_SELECTION--


    if (shadingModel == LIGHT_ONLY)
    albedo = vec3(1.);

    if (shadingModel == DETAIL || shadingModel == LIGHT_ONLY)
    fragColor = pbLightComputation();
    else {
        switch (shadingModel){
            case ALBEDO:
            fragColor = vec4(albedo, 1.);
            break;
            case NORMAL:
            fragColor = vec4(N, 1.);
            break;
            case DEPTH:
            fragColor = vec4(vec3(linearize(depthData.r)), 1.);
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
                float total =  isLightQuantity ? float(lightQuantity): float(MAX_LIGHTS * 3);
                float contribution = 0.;

                if (!flatShading){
                    viewSpacePosition = viewSpacePositionFromDepth(gl_FragCoord.z, quadUV);
                    albedoOverPI = vec3(1.);
                    F0 = mix(F0, albedoOverPI, 0.);

                    for (int i = 0; i < lightQuantity; i++){
                        if(checkLight(
                            lightPrimaryBuffer[i],
                            lightSecondaryBuffer[i],
                            lightTypeBuffer[i]
                        )) contribution++;
                    }

                }
                if (total > 0.)
                fragColor = vec4(mix(vec3(1., 0., 0.), vec3(0., .0, 1.), 1. - contribution/total), 1.);
                else
                fragColor = vec4(0., 0., 1., 1.);
                break;
            }
            case OVERDRAW:{
                vec2 a = floor(gl_FragCoord.xy);
                float checkerVal = 4.;

                if (!noDepthChecking && abs(depthData.r - gl_FragCoord.z) > FRAG_DEPTH_THRESHOLD){
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


