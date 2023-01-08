import UBO from "../instances/UBO";
import UberShader from "../utils/UberShader";

export enum StaticUBONames{
    CAMERA = "CameraMetadata",
    FRAME_COMPOSITION = "CompositionSettings",
    LENS_PP = "LensEffects",
    SSAO = "Settings",
    UBER = "UberShaderSettings",
}

export default class StaticUBOs{
    static #initialized  = false

    static cameraUBO?:UBO
    static frameCompositionUBO?:UBO
    static lensPostProcessingUBO?:UBO
    static ssaoUBO?:UBO
    static uberUBO?:UBO

    static initialize(){
        if(StaticUBOs.#initialized)
            return
        StaticUBOs.#initialized = true

        StaticUBOs.cameraUBO = new UBO(
            StaticUBONames.CAMERA,
            [
                {name: "viewProjection", type: "mat4"},
                {name: "viewMatrix", type: "mat4"},
                {name: "projectionMatrix", type: "mat4"},
                {name: "invViewMatrix", type: "mat4"},
                {name: "invProjectionMatrix", type: "mat4"},
                {name: "placement", type: "vec4"},
            ])

        StaticUBOs.frameCompositionUBO= new UBO(
            StaticUBONames.FRAME_COMPOSITION,
            [
                {type: "vec2", name: "inverseFilterTextureSize"},
                {type: "bool", name: "vignetteEnabled"},
                {type: "int", name: "AAMethod"},
                {type: "bool", name: "filmGrainEnabled"},
                {type: "float", name: "vignetteStrength"},
                {type: "float", name: "FXAASpanMax"},
                {type: "float", name: "FXAAReduceMin"},
                {type: "float", name: "FXAAReduceMul"},
                {type: "float", name: "filmGrainStrength"},
                {type: "float", name: "gamma"},
                {type: "float", name: "exposure"}
            ]
        )

        StaticUBOs.lensPostProcessingUBO = new UBO(
            StaticUBONames.LENS_PP,
            [
                {type: "float", name: "distortionIntensity"},
                {type: "float", name: "chromaticAberrationIntensity"},
                {type: "bool", name: "distortionEnabled"},
                {type: "bool", name: "chromaticAberrationEnabled"},
                {type: "bool", name: "bloomEnabled"},


                {type: "float", name: "focusDistanceDOF"},
                {type: "float", name: "apertureDOF"},
                {type: "float", name: "focalLengthDOF"},
                {type: "int", name: "samplesDOF"},
            ]
        )

        StaticUBOs.ssaoUBO = new UBO(
            StaticUBONames.SSAO,
            [
                {name: "settings", type: "vec4"},
                {name: "samples", type: "vec4", dataLength: 64},
                {name: "noiseScale", type: "vec2"}
            ]
        )

        StaticUBOs.uberUBO = new UBO(
            StaticUBONames.UBER,
            [
                {name: "shadowMapsQuantity", type: "float"},
                {name: "shadowMapResolution", type: "float"},
                {name: "lightQuantity", type: "int"},

                {type: "float", name: "SSRFalloff"},
                {type: "float", name: "stepSizeSSR"},
                {type: "float", name: "maxSSSDistance"},
                {type: "float", name: "SSSDepthThickness"},
                {type: "float", name: "SSSEdgeAttenuation"},
                {type: "float", name: "skylightSamples"},
                {type: "float", name: "SSSDepthDelta"},
                {type: "float", name: "SSAOFalloff"},
                {type: "int", name: "maxStepsSSR"},
                {type: "int", name: "maxStepsSSS"},
                {type: "bool", name: "hasSkylight"},
                {type: "bool", name: "hasAmbientOcclusion"},

                {name: "lightPrimaryBuffer", type: "mat4", dataLength: UberShader.MAX_LIGHTS},
                {name: "lightSecondaryBuffer", type: "mat4", dataLength: UberShader.MAX_LIGHTS},
                {name: "lightTypeBuffer", type: "int", dataLength: UberShader.MAX_LIGHTS}
            ]
        )
    }
}