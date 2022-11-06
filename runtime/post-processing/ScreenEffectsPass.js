import generateBlurBuffers from "../../utils/generate-blur-buffers"
import CameraAPI from "../../api/CameraAPI";
import GPU from "../../GPU";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import UBO from "../../instances/UBO";


let shader, uniforms
export default class ScreenEffectsPass {
    static workerTexture
    static outputFBO
    static resolution
    static blurBuffers
    static upSampledBuffers
    static compositeShader
    static upSamplingShader
    static brightShader
    static blurShader

    static UBO

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
    }

    static execute() {
        const {
            bloomStrength,
            bloomThreshold,
            bloom,
        } = CameraAPI.metadata
        const op = ScreenEffectsPass.outputFBO
        if (bloom) {
            op.startMapping()
            ScreenEffectsPass.brightShader.bindForUse({
                sceneColor: ScreenEffectsPass.workerTexture,
                threshold: bloomThreshold
            })
            GPU.quad.draw()
            op.stopMapping()
            ScreenEffectsPass.blur(op.colors[0], bloomStrength)
        }

        op.startMapping()
        shader.bind()

        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, ScreenEffectsPass.blurred)
        gpu.uniform1i(uniforms.blurred, 0)

        gpu.activeTexture(gpu.TEXTURE1)
        gpu.bindTexture(gpu.TEXTURE_2D, ScreenEffectsPass.workerTexture)
        gpu.uniform1i(uniforms.sceneColor, 1)

        GPU.quad.draw()
        op.stopMapping()
    }

    static blur(SAMPLER, bloomIntensity, sampleScale = 2, blurBuffers = ScreenEffectsPass.blurBuffers, upSampledBuffers = ScreenEffectsPass.upSampledBuffers, kernel = 7) {
        const q = blurBuffers.length

        for (let level = 0; level < q; level++) {
            const {width, height} = blurBuffers[level]
            const previousColor = level > 0 ? blurBuffers[level - 1].height.colors[0] : SAMPLER
            width.startMapping()
            ScreenEffectsPass.blurShader.bindForUse({
                sceneColor: previousColor,
                resolution: [width.width, width.height],
                isWidth: true,
                kernel
            })
            GPU.quad.draw()
            width.stopMapping()

            height.startMapping()
            ScreenEffectsPass.blurShader.bindForUse({
                sceneColor: width.colors[0],
                resolution: [height.width, height.height],
                isWidth: false
            })
            GPU.quad.draw()
            height.stopMapping()
        }

        for (let index = 0; index < q - 1; index++) {
            const current = upSampledBuffers[index]
            current.startMapping()
            ScreenEffectsPass.upSamplingShader.bindForUse({
                blurred: blurBuffers[index].height.colors[0],
                nextSampler: blurBuffers[index + 1].height.colors[0],
                resolution: [current.width, current.height],
                bloomIntensity,
                sampleScale
            })
            GPU.quad.draw()
            current.stopMapping()
        }
        return upSampledBuffers[q - 2].colors[0]


    }
}