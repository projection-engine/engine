import CameraAPI from "../api/CameraAPI";
import GPU from "../GPU";
import ScreenEffectsPass from "./post-processing/ScreenEffectsPass";
import GBuffer from "./renderers/GBuffer";
import AmbientOcclusion from "./occlusion/AmbientOcclusion";
import Engine from "../Engine";
import BufferBlur from "../api/BufferBlur";

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

let shader, uniforms, normalsShader, normalUniforms
export default class GlobalIlluminationPass {
    static SSGISampler
    static SSRSampler
    static unfilteredSSGISampler

    static baseFBO
    static blurBuffers
    static upSampledBuffers
    static normalsFBO
    static FBO
    static normalsShader
    static shader

    static normalSampler
    static rayMarchSettings = new Float32Array(9)



    static initialize() {
        GlobalIlluminationPass.unfilteredSSGISampler = GlobalIlluminationPass.FBO.colors[0]
        GlobalIlluminationPass.SSRSampler = GlobalIlluminationPass.FBO.colors[1]

        GlobalIlluminationPass.normalSampler = GlobalIlluminationPass.normalsFBO.colors[0]
        GlobalIlluminationPass.SSGISampler = GlobalIlluminationPass.baseFBO.colors[0]

        normalsShader = GlobalIlluminationPass.normalsShader
        normalUniforms = normalsShader.uniformMap
        shader = GlobalIlluminationPass.shader
        uniforms = shader.uniformMap


    }

    static execute() {

        if (GlobalIlluminationPass.rayMarchSettings[5] === 1) {
            GlobalIlluminationPass.normalsFBO.startMapping()
            normalsShader.bind()

            gpu.activeTexture(gpu.TEXTURE0)
            gpu.bindTexture(gpu.TEXTURE_2D, GBuffer.baseNormalSampler)
            gpu.uniform1i(normalUniforms.gNormal, 0)

            gpu.activeTexture(gpu.TEXTURE1)
            gpu.bindTexture(gpu.TEXTURE_2D, AmbientOcclusion.noiseSampler)
            gpu.uniform1i(normalUniforms.noise, 1)

            gpu.uniformMatrix4fv(normalUniforms.invViewMatrix, false, CameraAPI.invViewMatrix)
            gpu.uniform2fv(normalUniforms.noiseScale, AmbientOcclusion.noiseScale)

            GPU.quad.draw()
            GlobalIlluminationPass.normalsFBO.stopMapping()
        }

        GlobalIlluminationPass.FBO.startMapping()
        shader.bind()

        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, GBuffer.behaviourSampler)
        gpu.uniform1i(uniforms.gBehaviour, 0)

        gpu.activeTexture(gpu.TEXTURE1)
        gpu.bindTexture(gpu.TEXTURE_2D, GBuffer.baseNormalSampler)
        gpu.uniform1i(uniforms.gNormal, 1)

        gpu.activeTexture(gpu.TEXTURE2)
        gpu.bindTexture(gpu.TEXTURE_2D, GBuffer.positionSampler)
        gpu.uniform1i(uniforms.gPosition, 2)

        gpu.activeTexture(gpu.TEXTURE3)
        gpu.bindTexture(gpu.TEXTURE_2D, AmbientOcclusion.noiseSampler)
        gpu.uniform1i(uniforms.noiseSampler, 3)

        gpu.activeTexture(gpu.TEXTURE4)
        gpu.bindTexture(gpu.TEXTURE_2D, Engine.previousFrameSampler)
        gpu.uniform1i(uniforms.previousFrame, 4)

        gpu.activeTexture(gpu.TEXTURE5)
        gpu.bindTexture(gpu.TEXTURE_2D, GlobalIlluminationPass.normalSampler)
        gpu.uniform1i(uniforms.stochasticNormals, 5)

        gpu.uniformMatrix4fv(uniforms.viewMatrix, false, CameraAPI.viewMatrix)
        gpu.uniformMatrix4fv(uniforms.projection, false, CameraAPI.projectionMatrix)
        gpu.uniformMatrix4fv(uniforms.invViewMatrix, false, CameraAPI.invViewMatrix)
        gpu.uniform2fv(uniforms.noiseScale, AmbientOcclusion.noiseScale)
        gpu.uniformMatrix3fv(uniforms.rayMarchSettings, false, GlobalIlluminationPass.rayMarchSettings)

        GPU.quad.draw()
        GlobalIlluminationPass.FBO.stopMapping()

        BufferBlur.applyBlur(GlobalIlluminationPass.baseFBO, GlobalIlluminationPass.unfilteredSSGISampler, 5, 1, 2)
    }
}