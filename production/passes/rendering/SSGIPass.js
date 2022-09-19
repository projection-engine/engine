import * as ssGI from "../../shaders/SCREEN_SPACE.glsl"
import generateBlurBuffers from "../../utils/generate-blur-buffers"
import Engine from "../../Engine";
import CameraAPI from "../../apis/camera/CameraAPI";
import GPU from "../../GPU";
import STATIC_FRAMEBUFFERS from "../../../static/resources/STATIC_FRAMEBUFFERS";
import DepthPass from "./DepthPass";
import ScreenEffectsPass from "../post-processing/ScreenEffectsPass";
import DeferredPass from "./DeferredPass";
import AOPass from "./AOPass";
import STATIC_SHADERS from "../../../static/resources/STATIC_SHADERS";
import QuadAPI from "../../apis/rendering/QuadAPI";


export default class SSGIPass {
    static sampler
    static blurBuffers
    static upSampledBuffers
    static normalsFBO
    static FBO
    static normalsShader
    static ssgiShader
    static lastFrame
    static normalSampler


    static initialize() {
        const [blurBuffers, upSampledBuffers] = generateBlurBuffers(4, GPU.internalResolution.w, GPU.internalResolution.h, 2)
        SSGIPass.blurBuffers = blurBuffers
        SSGIPass.upSampledBuffers = upSampledBuffers

        SSGIPass.normalsShader = GPU.allocateShader(STATIC_SHADERS.PRODUCTION.SSGI_NORMALS, ssGI.vShader, ssGI.stochasticNormals)
        SSGIPass.normalsFBO = GPU.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI_NORMALS)
        SSGIPass.normalsFBO.texture({linear: true})
        SSGIPass.normalSampler = SSGIPass.normalsFBO.colors[0]

        SSGIPass.FBO = GPU.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI)
        SSGIPass.FBO.texture({linear: true})
        SSGIPass.ssgiShader = GPU.allocateShader(STATIC_SHADERS.PRODUCTION.SSGI, ssGI.vShader, ssGI.ssGI)
        SSGIPass.lastFrame = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.CURRENT_FRAME).colors[0]

        SSGIPass.sampler = upSampledBuffers[blurBuffers.length - 2].colors[0]
        DeferredPass.deferredUniforms.screenSpaceGI = SSGIPass.sampler
    }

    static execute() {
        const {
            ssgi,
            ssgiQuality,
            ssgiBrightness,
            ssgiStepSize
        } = Engine.params

        if (ssgi) {
            SSGIPass.normalsFBO.startMapping()
            SSGIPass.normalsShader.bindForUse({
                gNormal: DepthPass.normalSampler,
                noise: AOPass.noiseSampler
            })
            QuadAPI.draw()
            SSGIPass.normalsFBO.stopMapping()


            SSGIPass.FBO.startMapping()
            SSGIPass.ssgiShader.bindForUse({
                previousFrame: SSGIPass.lastFrame,
                gPosition: DeferredPass.positionSampler,
                gNormal: SSGIPass.normalSampler,
                projection: CameraAPI.projectionMatrix,
                viewMatrix: CameraAPI.viewMatrix,
                invViewMatrix: CameraAPI.invViewMatrix,
                step: ssgiStepSize,
                maxSteps: ssgiQuality,
                intensity: ssgiBrightness,
                noiseSampler: AOPass.noiseSampler
            })
            QuadAPI.draw()
            SSGIPass.FBO.stopMapping()
            ScreenEffectsPass.blur(SSGIPass.FBO, 1, SSGIPass.blurBuffers, SSGIPass.upSampledBuffers)
        }
    }
}