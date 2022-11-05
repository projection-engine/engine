import generateBlurBuffers from "../../utils/generate-blur-buffers"
import CameraAPI from "../../api/CameraAPI";
import GPU from "../../GPU";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";

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
    static uniforms = {}

    static initialize() {
        const [blurBuffers, upSampledBuffers] = generateBlurBuffers(4, GPU.internalResolution.w, GPU.internalResolution.h)

        ScreenEffectsPass.blurred = upSampledBuffers[blurBuffers.length - 2].colors[0]

        ScreenEffectsPass.blurBuffers = blurBuffers
        ScreenEffectsPass.upSampledBuffers = upSampledBuffers


        ScreenEffectsPass.outputFBO = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER)
        ScreenEffectsPass.workerTexture = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.CURRENT_FRAME).colors[0]

        ScreenEffectsPass.uniforms = {
            blurred: ScreenEffectsPass.blurred,
            resolution: ScreenEffectsPass.resolution,
            sceneColor: ScreenEffectsPass.workerTexture
        }
    }

    static execute() {
        const {
            bloomStrength,
            bloomThreshold,
            bloom,
            postProcessingStrength,
            postProcessingEffects
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

        const u = ScreenEffectsPass.uniforms
        u.settings = postProcessingEffects
        u.intensity = postProcessingStrength
        op.startMapping()
        ScreenEffectsPass.compositeShader.bindForUse(u)
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