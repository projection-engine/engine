import {vertex} from "../../templates/shaders/FXAA.glsl"
import * as shaderCode from "../../templates/shaders/EFFECTS.glsl"
import generateBlurBuffers from "../../utils/generate-blur-buffers"
import CameraAPI from "../apis/CameraAPI";
import GPUResources from "../../GPUResources";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import GPUController from "../../GPUController";

export default class ScreenEffectsPass {
    static workerTexture
    static outputFBO
    static resolution
    static blurBuffers
    static upSampledBuffers
    static compositeShader
    static upSamplingShader
    static     brightShader
    static blurShader
    static uniforms = {}

    static initialize() {
        const [blurBuffers, upSampledBuffers] = generateBlurBuffers(4, GPUResources.internalResolution.w, GPUResources.internalResolution.h)

        ScreenEffectsPass.blurred = upSampledBuffers[blurBuffers.length - 2].colors[0]

        ScreenEffectsPass.blurBuffers = blurBuffers
        ScreenEffectsPass.upSampledBuffers = upSampledBuffers

        ScreenEffectsPass.compositeShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.SCREEN_COMPOSITION, vertex, shaderCode.compositeFragment,)
        ScreenEffectsPass.upSamplingShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.BILINEAR_UP_SAMPLING, vertex, shaderCode.bilinearUpSampling,)
        ScreenEffectsPass.brightShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.BLOOM_MASK, vertex, shaderCode.brightFragment,)
        ScreenEffectsPass.blurShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.BOX_BLUR, vertex, shaderCode.blurBox)
        ScreenEffectsPass.outputFBO = GPUResources.frameBuffers.get(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER)
        ScreenEffectsPass.workerTexture = GPUResources.frameBuffers.get(STATIC_FRAMEBUFFERS.CURRENT_FRAME).colors[0]

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
            GPUResources.quad.draw()
            op.stopMapping()
            ScreenEffectsPass.blur(op, bloomStrength)
        }

        const u = ScreenEffectsPass.uniforms
        u.settings = postProcessingEffects
        u.intensity = postProcessingStrength
        op.startMapping()
        ScreenEffectsPass.compositeShader.bindForUse(u)
        GPUResources.quad.draw()
        op.stopMapping()
    }

    static blur(fbo, bloomIntensity, sampleScale = 2, blurBuffers = ScreenEffectsPass.blurBuffers, upSampledBuffers = ScreenEffectsPass.upSampledBuffers, kernel = 7) {
        const q = blurBuffers.length

        for (let level = 0; level < q; level++) {
            const {width, height} = blurBuffers[level]
            const previousColor = level > 0 ? blurBuffers[level - 1].height.colors[0] : fbo.colors[0]
            width.startMapping()
            ScreenEffectsPass.blurShader.bindForUse({
                sceneColor: previousColor,
                resolution: [width.width, width.height],
                isWidth: true,
                kernel
            })
            GPUResources.quad.draw()
            width.stopMapping()

            height.startMapping()
            ScreenEffectsPass.blurShader.bindForUse({
                sceneColor: width.colors[0],
                resolution: [height.width, height.height],
                isWidth: false
            })
            GPUResources.quad.draw()
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
            GPUResources.quad.draw()
            current.stopMapping()
        }
        return upSampledBuffers[q - 2].colors[0]


    }
}