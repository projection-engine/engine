import CameraAPI from "../api/CameraAPI";
import GPUResources from "../GPUResources";
import ScreenEffectsPass from "./post-processing/ScreenEffectsPass";
import GBuffer from "./renderers/GBuffer";
import AmbientOcclusion from "./occlusion/AmbientOcclusion";

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
        SSGIPass.normalSampler = SSGIPass.normalsFBO.colors[0]
        SSGIPass.sampler = SSGIPass.upSampledBuffers[SSGIPass.blurBuffers.length - 2].colors[0]
        GBuffer.deferredUniforms.screenSpaceGI = SSGIPass.sampler
        SSGIPass.settingsBuffer[1] = 1


        Object.assign(SSGIPass.normalUniforms, {
            gNormal: GBuffer.normalSampler,
            noiseScale: AmbientOcclusion.noiseScale,
            invViewMatrix: CameraAPI.invViewMatrix
        })
        Object.assign(SSGIPass.uniforms, {

            gNormal: SSGIPass.normalSampler,
            projection: CameraAPI.projectionMatrix,
            viewMatrix: CameraAPI.viewMatrix,
            noiseScale: AmbientOcclusion.noiseScale,
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
        ScreenEffectsPass.blur(SSGIPass.FBO, 1, 2, SSGIPass.blurBuffers, SSGIPass.upSampledBuffers)
    }
}