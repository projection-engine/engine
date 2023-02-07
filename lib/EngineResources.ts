import Physics from "../runtime/Physics";
import SSGI from "../runtime/SSGI";
import StaticUBOs from "./StaticUBOs";
import SSAO from "../runtime/SSAO";
import VisibilityRenderer from "../runtime/VisibilityRenderer";


export default class EngineResources {
    static #SSGISettings = new Float32Array(3)
    static get SSGISettings() {
        return EngineResources.#SSGISettings
    }

    static #BOOL_BUFFER = new Uint8Array(1)
    static #FLOAT_BUFFER = new Float32Array(1)

    static updateParams(FXAASettings:FXAASettings, SSGISettings: SSGISettings, SSRSettings:SSRSettings, SSSSettings:SSSSettings, SSAOSettings:SSAOSettings, physicsSteps: number, physicsSubSteps: number) {
        Physics.stop()
        Physics.simulationStep = physicsSteps
        Physics.start()
        Physics.subSteps = physicsSubSteps


        SSGI.enabled = SSGISettings.enabled
        SSGI.blurSamples = SSGISettings.blurSamples || 5
        SSGI.blurRadius = SSGISettings.blurRadius || 5
        EngineResources.#SSGISettings[0] = SSGISettings.stepSize || 1
        EngineResources.#SSGISettings[1] = SSGISettings.maxSteps || 4
        EngineResources.#SSGISettings[2] = SSGISettings.strength || 1

        StaticUBOs.uberUBO.bind()
        EngineResources.#FLOAT_BUFFER[0] = SSRSettings.falloff || 3
        StaticUBOs.uberUBO.updateData("SSRFalloff", EngineResources.#FLOAT_BUFFER)
        EngineResources.#FLOAT_BUFFER[0] = SSRSettings.stepSize || 1
        StaticUBOs.uberUBO.updateData("stepSizeSSR", EngineResources.#FLOAT_BUFFER)
        EngineResources.#FLOAT_BUFFER[0] = SSSSettings.maxDistance || .05
        StaticUBOs.uberUBO.updateData("maxSSSDistance", EngineResources.#FLOAT_BUFFER)
        EngineResources.#FLOAT_BUFFER[0] = SSSSettings.depthThickness || .05
        StaticUBOs.uberUBO.updateData("SSSDepthThickness", EngineResources.#FLOAT_BUFFER)
        EngineResources.#FLOAT_BUFFER[0] = SSSSettings.edgeFalloff || 12
        StaticUBOs.uberUBO.updateData("SSSEdgeAttenuation", EngineResources.#FLOAT_BUFFER)
        EngineResources.#FLOAT_BUFFER[0] = SSSSettings.depthDelta || 0
        StaticUBOs.uberUBO.updateData("SSSDepthDelta", EngineResources.#FLOAT_BUFFER)
        EngineResources.#BOOL_BUFFER[0] = SSRSettings.maxSteps || 4
        StaticUBOs.uberUBO.updateData("maxStepsSSR", EngineResources.#BOOL_BUFFER)
        EngineResources.#BOOL_BUFFER[0] = SSSSettings.maxSteps || 24
        StaticUBOs.uberUBO.updateData("maxStepsSSS", EngineResources.#BOOL_BUFFER)
        EngineResources.#BOOL_BUFFER[0] = SSAOSettings.enabled ? 1 : 0
        StaticUBOs.uberUBO.updateData("hasAmbientOcclusion", EngineResources.#BOOL_BUFFER)
        EngineResources.#FLOAT_BUFFER[0] = SSAOSettings.falloffDistance || 1000
        StaticUBOs.uberUBO.updateData("SSAOFalloff", EngineResources.#FLOAT_BUFFER)
        StaticUBOs.uberUBO.unbind()


        StaticUBOs.ssaoUBO.bind()
        StaticUBOs.ssaoUBO.updateData("settings", new Float32Array([SSAOSettings.radius || .25, SSAOSettings.power || 1, SSAOSettings.bias || .1, SSAOSettings.falloffDistance || 1000]))
        StaticUBOs.ssaoUBO.unbind()

        SSAO.blurSamples = SSAOSettings.blurSamples || 2
        SSAO.maxSamples = SSAOSettings.maxSamples || 64
        SSAO.enabled = SSAOSettings.enabled

        StaticUBOs.frameCompositionUBO.bind()
        EngineResources.#FLOAT_BUFFER[0] = FXAASettings.FXAASpanMax || 8
        StaticUBOs.frameCompositionUBO.updateData("FXAASpanMax", EngineResources.#FLOAT_BUFFER)
        EngineResources.#BOOL_BUFFER[0] = FXAASettings.FXAA ? 1 : 0
        StaticUBOs.frameCompositionUBO.updateData("useFXAA", EngineResources.#BOOL_BUFFER)
        EngineResources.#FLOAT_BUFFER[0] = FXAASettings.FXAAReduceMin || 1.0 / 128.0
        StaticUBOs.frameCompositionUBO.updateData("FXAAReduceMin", EngineResources.#FLOAT_BUFFER)
        EngineResources.#FLOAT_BUFFER[0] = FXAASettings.FXAAReduceMul || 1.0 / 8.0
        StaticUBOs.frameCompositionUBO.updateData("FXAAReduceMul", EngineResources.#FLOAT_BUFFER)
        StaticUBOs.frameCompositionUBO.unbind()

        VisibilityRenderer.needsUpdate = true
    }
}