import CameraAPI from "../api/CameraAPI";
import GPUResources from "../GPUResources";
import ScreenEffectsPass from "./post-processing/ScreenEffectsPass";
import GBuffer from "./renderers/GBuffer";
import AmbientOcclusion from "./occlusion/AmbientOcclusion";

/**
 * rayMarchSettings definition:
 *
 * 0: SSR-falloff
 * 1: SSR-minRayStep
 * 2: SSR-stepSize
 * 3: SSGI_stepSize
 * 4: SSGI_intensity
 * 5: ENABLED_SSGI
 * 6: ENABLED_SSR
 * 7: SSGI_maxSteps
 * 8: SSR_maxSteps
 */
export default class GlobalIlluminationPass {
    static SSGISampler
    static SSRSampler
    static unfilteredSSGISampler

    static blurBuffers
    static upSampledBuffers
    static normalsFBO
    static FBO
    static normalsShader
    static shader

    static normalSampler
    static rayMarchSettings = new Float32Array(9)

    static normalUniforms = {}
    static uniforms = {}

    static initialize() {
        GlobalIlluminationPass.unfilteredSSGISampler = GlobalIlluminationPass.FBO.colors[0]
        GlobalIlluminationPass.SSRSampler = GlobalIlluminationPass.FBO.colors[1]

        GlobalIlluminationPass.normalSampler = GlobalIlluminationPass.normalsFBO.colors[0]
        GlobalIlluminationPass.SSGISampler = GlobalIlluminationPass.upSampledBuffers[GlobalIlluminationPass.blurBuffers.length - 2].colors[0]

        GBuffer.deferredUniforms.screenSpaceGI = GlobalIlluminationPass.SSGISampler
        GBuffer.deferredUniforms.screenSpaceReflections = GlobalIlluminationPass.SSRSampler

        Object.assign(GlobalIlluminationPass.normalUniforms, {
            gNormal: undefined,
            noiseScale: AmbientOcclusion.noiseScale,
            invViewMatrix: CameraAPI.invViewMatrix
        })
        Object.assign(GlobalIlluminationPass.uniforms, {
            noiseSampler: undefined,
            previousFrame: undefined,
            gPosition: undefined,
            gNormal: undefined,
            gBehaviour: undefined,
            projection: CameraAPI.projectionMatrix,
            viewMatrix: CameraAPI.viewMatrix,
            invViewMatrix: CameraAPI.invViewMatrix,
            noiseScale: AmbientOcclusion.noiseScale,
            stochasticNormals: GlobalIlluminationPass.normalSampler,
            rayMarchSettings: GlobalIlluminationPass.rayMarchSettings
        })

    }

    static execute() {

        if (GlobalIlluminationPass.rayMarchSettings[5] === 1) {
            GlobalIlluminationPass.normalsFBO.startMapping()
            GlobalIlluminationPass.normalsShader.bindForUse(GlobalIlluminationPass.normalUniforms)
            GPUResources.quad.draw()
            GlobalIlluminationPass.normalsFBO.stopMapping()
        }

        GlobalIlluminationPass.FBO.startMapping()
        GlobalIlluminationPass.shader.bindForUse(GlobalIlluminationPass.uniforms)
        GPUResources.quad.draw()
        GlobalIlluminationPass.FBO.stopMapping()
        ScreenEffectsPass.blur(GlobalIlluminationPass.unfilteredSSGISampler, 1, 2, GlobalIlluminationPass.blurBuffers, GlobalIlluminationPass.upSampledBuffers)
    }
}