import FramebufferInstance from "../../instances/FramebufferInstance"
import * as ssGI from "../../shaders/SCREEN_SPACE.glsl"
import generateBlurBuffers from "../../utils/generate-blur-buffers"
import Engine from "../../Engine";
import CameraAPI from "../../apis/CameraAPI";
import GPU from "../../GPU";
import STATIC_FRAMEBUFFERS from "../../../static/resources/STATIC_FRAMEBUFFERS";
import DepthPass from "./DepthPass";
import ScreenEffectsPass from "../post-processing/ScreenEffectsPass";
import DeferredPass from "../rendering/DeferredPass";
import AOPass from "./AOPass";
import STATIC_SHADERS from "../../../static/resources/STATIC_SHADERS";
import QuadAPI from "../../apis/QuadAPI";


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
        SSGIPass.normalsShader =  GPU.allocateShader(STATIC_SHADERS.PRODUCTION.SSGI_NORMALS, ssGI.vShader, ssGI.stochasticNormals)
        SSGIPass.ssgiShader =  GPU.allocateShader(STATIC_SHADERS.PRODUCTION.SSGI, ssGI.vShader, ssGI.ssGI)

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
        QuadAPI.draw()
        SSGIPass.normalsFBO.stopMapping()
    }

    static execute() {
        const {
            ssgi,
            ssgiQuality,
            ssgiBrightness,
            ssgiStepSize
        } = Engine.params

        if (ssgi) {
            SSGIPass.#normalPass()
            SSGIPass.FBO.startMapping()
            SSGIPass.ssgiShader.bindForUse({
                previousFrame: DeferredPass.albedoSampler,
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
            QuadAPI.draw()
            SSGIPass.FBO.stopMapping()
            ScreenEffectsPass.blur(SSGIPass.FBO, 1, SSGIPass.blurBuffers, SSGIPass.upSampledBuffers, 1.)
        }
    }
}