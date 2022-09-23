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
    static settingsBuffer = new Float32Array(2)

    static initialize() {
        const [blurBuffers, upSampledBuffers] = generateBlurBuffers(3, GPU.internalResolution.w, GPU.internalResolution.h, 2)
        SSGIPass.blurBuffers = blurBuffers
        SSGIPass.upSampledBuffers = upSampledBuffers

        SSGIPass.normalsShader = GPU.allocateShader(STATIC_SHADERS.PRODUCTION.SSGI_NORMALS, ssGI.vShader, ssGI.stochasticNormals)
        SSGIPass.normalsFBO = GPU.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI_NORMALS)
        SSGIPass.normalsFBO.texture({precision: gpu.RGBA32F, linear: true})
        SSGIPass.normalSampler = SSGIPass.normalsFBO.colors[0]

        SSGIPass.FBO = GPU.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI)
        SSGIPass.FBO.texture({linear: true})
        SSGIPass.ssgiShader = GPU.allocateShader(STATIC_SHADERS.PRODUCTION.SSGI, ssGI.vShader, ssGI.ssGI)

        SSGIPass.sampler = upSampledBuffers[blurBuffers.length - 2].colors[0]
        DeferredPass.deferredUniforms.screenSpaceGI = SSGIPass.sampler
        SSGIPass.settingsBuffer[1] = 1
    }

    static execute() {
        const {
            ssgi,
            ssgiQuality
        } = Engine.params

        if (ssgi) {
            SSGIPass.normalsFBO.startMapping()
            SSGIPass.normalsShader.bindForUse({
                gNormal: DepthPass.normalSampler,
                noise: AOPass.noiseSampler,
                noiseScale: AOPass.noiseScale,
            })
            GPU.quad.draw()
            SSGIPass.normalsFBO.stopMapping()


            SSGIPass.FBO.startMapping()
            SSGIPass.ssgiShader.bindForUse({
                previousFrame: SSGIPass.lastFrame,
                gPosition: DeferredPass.positionSampler,
                gNormal: SSGIPass.normalSampler,
                projection: CameraAPI.projectionMatrix,
                viewMatrix: CameraAPI.viewMatrix,
                invViewMatrix: CameraAPI.invViewMatrix,
                noiseScale: AOPass.noiseScale,
                maxSteps: ssgiQuality,
                settings: SSGIPass.settingsBuffer,
                noiseSampler: AOPass.noiseSampler
            })
            GPU.quad.draw()
            SSGIPass.FBO.stopMapping()
            ScreenEffectsPass.blur(SSGIPass.FBO, 1, 3, SSGIPass.blurBuffers, SSGIPass.upSampledBuffers)
        }
    }
}