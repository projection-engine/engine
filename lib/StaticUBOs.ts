import UBO from "../instances/UBO";
import UberShader from "../resource-libs/UberShader";
import GPU from "../GPU";

export enum StaticUBONames {
    CAMERA_VIEW = "CameraViewInfo",
    FRAME_COMPOSITION = "CompositionSettings",
    LENS_PP = "LensEffects",
    SSAO = "Settings",
    UBER = "UberShaderSettings",
    LIGHTS = "Lights",
    CAMERA_PROJECTION = "CameraProjectionInfo"
}

export default class StaticUBOs {
    static #initialized = false

    static cameraViewUBO?: UBO
    static frameCompositionUBO?: UBO
    static lensPostProcessingUBO?: UBO
    static ssaoUBO?: UBO
    static uberUBO?: UBO
    static lightsUBO?: UBO
    static cameraProjectionUBO?: UBO

    static initialize() {
        if (StaticUBOs.#initialized)
            return
        StaticUBOs.#initialized = true

        StaticUBOs.cameraViewUBO = new UBO(
            StaticUBONames.CAMERA_VIEW,
            [
                {name: "viewProjection", type: "mat4"},
                {name: "viewMatrix", type: "mat4"},
                {name: "invViewMatrix", type: "mat4"},
                {name: "placement", type: "vec4"},
            ])

        StaticUBOs.cameraProjectionUBO = new UBO(
            StaticUBONames.CAMERA_PROJECTION,
            [
                {name: "projectionMatrix", type: "mat4"},
                {name: "invProjectionMatrix", type: "mat4"},
                {name: "bufferResolution", type: "vec2"},
                {name: "logDepthFC", type: "float"},
                {name: "logC", type: "float"},
            ])

        StaticUBOs.frameCompositionUBO = new UBO(
            StaticUBONames.FRAME_COMPOSITION,
            [
                {type: "vec2", name: "inverseFilterTextureSize"},

                {type: "bool", name: "useFXAA"},
                {type: "bool", name: "filmGrainEnabled"},

                {type: "float", name: "FXAASpanMax"},
                {type: "float", name: "FXAAReduceMin"},
                {type: "float", name: "FXAAReduceMul"},
                {type: "float", name: "filmGrainStrength"},

            ]
        )

        StaticUBOs.lensPostProcessingUBO = new UBO(
            StaticUBONames.LENS_PP,
            [
                {type: "float", name: "textureSizeXDOF"},
                {type: "float", name: "textureSizeYDOF"},
                {type: "float", name: "distortionIntensity"},
                {type: "float", name: "chromaticAberrationIntensity"},
                {type: "bool", name: "distortionEnabled"},
                {type: "bool", name: "chromaticAberrationEnabled"},
                {type: "bool", name: "bloomEnabled"},


                {type: "float", name: "focusDistanceDOF"},
                {type: "float", name: "apertureDOF"},
                {type: "float", name: "focalLengthDOF"},
                {type: "float", name: "samplesDOF"},

                {type: "bool", name: "vignetteEnabled"},
                {type: "float", name: "vignetteStrength"},
                {type: "float", name: "gamma"},
                {type: "float", name: "exposure"}
            ]
        )

        const F32 = new Float32Array([2.2])
        StaticUBOs.lensPostProcessingUBO.bind()
        StaticUBOs.lensPostProcessingUBO.updateData("gamma", F32)
        F32[0] = 1
        StaticUBOs.lensPostProcessingUBO.updateData("exposure", F32)
        F32[0] = GPU.internalResolution.w
        StaticUBOs.lensPostProcessingUBO.updateData("textureSizeXDOF", F32)
        F32[0] = GPU.internalResolution.h
        StaticUBOs.lensPostProcessingUBO.updateData("textureSizeYDOF", F32)
        StaticUBOs.lensPostProcessingUBO.unbind()

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
                {type: "bool", name: "hasAmbientOcclusion"}
            ]
        )
        StaticUBOs.lightsUBO = new UBO(
            StaticUBONames.LIGHTS,
            [
                {name: "lightPrimaryBuffer", type: "mat4", dataLength: UberShader.MAX_LIGHTS},
                {name: "lightSecondaryBuffer", type: "mat4", dataLength: UberShader.MAX_LIGHTS},
            ]
        )
    }
}