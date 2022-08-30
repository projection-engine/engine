import FramebufferInstance from "../../controllers/instances/FramebufferInstance"
import ShaderInstance from "../../controllers/instances/ShaderInstance"
import * as ssGI from "../../data/shaders/SCREEN_SPACE.glsl"
import generateBlurBuffers from "../../utils/generate-blur-buffers"
import LoopController from "../../controllers/LoopController";
import RendererController from "../../controllers/RendererController";
import CameraAPI from "../../libs/apis/CameraAPI";
import GPU from "../../controllers/GPU";
import STATIC_FRAMEBUFFERS from "../../../static/STATIC_FRAMEBUFFERS";
import DepthPass from "./DepthPass";
import ScreenEffectsPass from "./ScreenEffectsPass";
import DeferredPass from "./DeferredPass";
import AOPass from "./AOPass";


export default class SSGIPass {
    static sampler
    static blurBuffers
    static upSampledBuffers
    static normalsFBO
    static FBO
    static normalsShader
    static ssgiShader
    static lastFrame
    static normalsSampler


    static initialize() {
        const [blurBuffers, upSampledBuffers] = generateBlurBuffers(3, GPU.internalResolution.w, GPU.internalResolution.h, 4)
        SSGIPass.blurBuffers = blurBuffers
        SSGIPass.upSampledBuffers = upSampledBuffers

        SSGIPass.normalsFBO = (new FramebufferInstance()).texture()
        SSGIPass.FBO = (new FramebufferInstance()).texture()
        SSGIPass.normalsShader = new ShaderInstance(ssGI.vShader, ssGI.stochasticNormals)
        SSGIPass.ssgiShader = new ShaderInstance(ssGI.vShader, ssGI.ssGI)

        SSGIPass.lastFrame = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.CURRENT_FRAME).colors[0]
        SSGIPass.normalsSampler = SSGIPass.normalsFBO.colors[0]
        SSGIPass.sampler = upSampledBuffers[SSGIPass.blurBuffers.length - 2].colors[0]
    }


    static #normalPass() {
        SSGIPass.normalsFBO.startMapping()
        SSGIPass.normalsShader.bindForUse({
            gNormal: DepthPass.normal,
            noise: AOPass.noiseTexture
        })
        GPU.quad.draw()
        SSGIPass.normalsFBO.stopMapping()
    }

    static execute() {
        const {
            ssgi,
            ssgiQuality,
            ssgiBrightness,
            ssgiStepSize
        } = RendererController.params

        if (ssgi) {
            SSGIPass.#normalPass()
            SSGIPass.FBO.startMapping()
            SSGIPass.ssgiShader.bindForUse({
                previousFrame: SSGIPass.lastFrame,
                gPosition: DeferredPass.positionSampler,
                gNormal: SSGIPass.normalsSampler,
                projection: CameraAPI.projectionMatrix,
                viewMatrix: CameraAPI.viewMatrix,
                invViewMatrix: CameraAPI.invViewMatrix,
                step: ssgiStepSize,
                maxSteps: ssgiQuality,
                intensity: ssgiBrightness,
                noiseSampler: AOPass.noiseTexture
            })
            GPU.quad.draw()
            SSGIPass.FBO.stopMapping()
            ScreenEffectsPass.blur(SSGIPass.FBO, 1, SSGIPass.blurBuffers, SSGIPass.upSampledBuffers, 1.)
        }
    }
}