import * as ssGI from "../../../templates/shaders/SCREEN_SPACE.glsl"
import generateBlurBuffers from "../../../utils/generate-blur-buffers"
import CameraAPI from "../../apis/CameraAPI";
import GPUResources from "../../../GPUResources";
import STATIC_FRAMEBUFFERS from "../../../static/resources/STATIC_FRAMEBUFFERS";
import DepthPass from "./DepthPass";
import ScreenEffectsPass from "../post-processing/ScreenEffectsPass";
import DeferredPass from "./DeferredPass";
import AOPass from "./AOPass";
import STATIC_SHADERS from "../../../static/resources/STATIC_SHADERS";
import GPUController from "../../../GPUController";


export default class SSGIPass {
    static sampler
    static blurBuffers
    static upSampledBuffers
    static normalsFBO
    static FBO
    static normalsShader
    static ssgiShader

    static normalSampler
    static settingsBuffer = new Float32Array(2)
    static rayMarchSettings = new Float32Array(3)

    static enabled = true
    static normalUniforms = {}
    static uniforms = {}

    static initialize() {

        SSGIPass.rayMarchSettings[0] = 10
        SSGIPass.rayMarchSettings[1] = 5
        SSGIPass.rayMarchSettings[2] = 1.2

        const [blurBuffers, upSampledBuffers] = generateBlurBuffers(3, GPUResources.internalResolution.w, GPUResources.internalResolution.h, 2)
        SSGIPass.blurBuffers = blurBuffers
        SSGIPass.upSampledBuffers = upSampledBuffers

        SSGIPass.normalsShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.SSGI_NORMALS, ssGI.vShader, ssGI.stochasticNormals)
        SSGIPass.normalsFBO = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI_NORMALS)
        SSGIPass.normalsFBO.texture({precision: gpu.RGBA32F, linear: true})
        SSGIPass.normalSampler = SSGIPass.normalsFBO.colors[0]

        SSGIPass.FBO = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI)
        SSGIPass.FBO.texture({linear: true})
        SSGIPass.ssgiShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.SSGI, ssGI.vShader, ssGI.ssGI)

        SSGIPass.sampler = upSampledBuffers[blurBuffers.length - 2].colors[0]
        DeferredPass.deferredUniforms.screenSpaceGI = SSGIPass.sampler
        SSGIPass.settingsBuffer[1] = 1


        Object.assign(SSGIPass.normalUniforms, {
            gNormal: DepthPass.normalSampler,
            noiseScale: AOPass.noiseScale,
        })
        Object.assign(SSGIPass.uniforms, {
            gNormal: SSGIPass.normalSampler,
            projection: CameraAPI.projectionMatrix,
            viewMatrix: CameraAPI.viewMatrix,
            invViewMatrix: CameraAPI.invViewMatrix,
            noiseScale: AOPass.noiseScale,
            settings: SSGIPass.settingsBuffer,
            rayMarchSettings: SSGIPass.rayMarchSettings
        })

    }

    static execute() {
        if (!SSGIPass.enabled)
            return

        SSGIPass.normalsFBO.startMapping()
        SSGIPass.normalsShader.bindForUse(SSGIPass.normalUniforms)
        GPUResources.quad.draw()
        SSGIPass.normalsFBO.stopMapping()

        SSGIPass.FBO.startMapping()
        SSGIPass.ssgiShader.bindForUse(SSGIPass.uniforms)
        GPUResources.quad.draw()
        SSGIPass.FBO.stopMapping()
        ScreenEffectsPass.blur(SSGIPass.FBO, 1, 3, SSGIPass.blurBuffers, SSGIPass.upSampledBuffers)
    }
}