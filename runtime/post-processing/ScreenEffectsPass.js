import CameraAPI from "../../api/CameraAPI";
import GPU from "../../GPU";
import UBO from "../../instances/UBO";



let shader, uniforms, metadata

export default class ScreenEffectsPass {
    static workerTexture
    static outputFBO
    static blurBuffers
    static upSampledBuffers
    static compositeShader

    static brightShader
    static baseFBO
    static UBO
    static blurredSampler

    static initialize() {
        ScreenEffectsPass.UBO = new UBO(
            "LensEffects",
            [
                {type: "float", name: "distortionIntensity"},
                {type: "float", name: "chromaticAberrationIntensity"},
                {type: "bool", name: "distortionEnabled"},
                {type: "bool", name: "chromaticAberrationEnabled"},
                {type: "bool", name: "bloomEnabled"},]
        )
        ScreenEffectsPass.UBO.bindWithShader(ScreenEffectsPass.compositeShader.program)
        shader = ScreenEffectsPass.compositeShader
        uniforms = shader.uniformMap

        metadata = CameraAPI.metadata
        ScreenEffectsPass.blurredSampler = ScreenEffectsPass.baseFBO.colors[0]
    }

    static execute() {
        const op = ScreenEffectsPass.outputFBO
        if (metadata.bloom) {
            op.startMapping()
            ScreenEffectsPass.brightShader.bindForUse({
                sceneColor: ScreenEffectsPass.workerTexture,
                threshold: metadata.bloomThreshold
            })
            GPU.quad.draw()
            op.stopMapping()
            // BufferBlur.applyBlur(ScreenEffectsPass.baseFBO, op.colors[0], 5, 1, 2)
        }

        op.startMapping()
        shader.bind()

        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, ScreenEffectsPass.blurredSampler)
        gpu.uniform1i(uniforms.blurred, 0)

        gpu.activeTexture(gpu.TEXTURE1)
        gpu.bindTexture(gpu.TEXTURE_2D, ScreenEffectsPass.workerTexture)
        gpu.uniform1i(uniforms.sceneColor, 1)

        GPU.quad.draw()
        op.stopMapping()
    }

}