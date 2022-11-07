
import GPU from "../GPU";
import Framebuffer from "../instances/Framebuffer";
import GBuffer from "../runtime/renderers/GBuffer";
import GPUAPI from "./GPUAPI";


let blurShader, blurShaderUniforms, resolution = new Float32Array(2), source
let biLinearShader, biLinearShaderUniforms
export default class BufferBlur {
    static downSampleBuffers
    static upSampleBuffers

    static blurShader
    static downsamplingShader

    static initialize() {
        const [downSampleBuffers, upSampleBuffers] = BufferBlur.generateBuffers(1, GPU.internalResolution.w, GPU.internalResolution.h)
        BufferBlur.downSampleBuffers = downSampleBuffers
        BufferBlur.upSampleBuffers = upSampleBuffers

        resolution[0] = GPU.internalResolution.w
        resolution[1] = GPU.internalResolution.h



        blurShader = BufferBlur.blurShader
        blurShaderUniforms = blurShader.uniformMap
        biLinearShader = BufferBlur.downsamplingShader
        biLinearShaderUniforms= biLinearShader.uniformMap
        console.log(biLinearShaderUniforms)
    }

    static generateBuffers(quantity, w, h) {
        const downSampleBuffers = [], upSampleBuffers = []
        for (let i = 0; i < quantity; i++) {
            downSampleBuffers.push(
                new Framebuffer(w, h).texture({linear: true})
            )
        }
        for (let i = 0; i < quantity; i++) {
            upSampleBuffers.push(new Framebuffer(w, h).texture({linear: true}))
        }
        return [downSampleBuffers, upSampleBuffers]
    }

    static applyBlur(targetFBO, sampler, radius, bloomIntensity = 1) {
        const blurBuffers = BufferBlur.downSampleBuffers
        const upSampleBuffers = BufferBlur.upSampleBuffers
        const q = blurBuffers.length
        source = upSampleBuffers[window.inD || 0]

        biLinearShader.bind()
        for (let level = 0; level < q; level++) {
            const fbo = blurBuffers[level]
            const previousColor = level > 0 ? blurBuffers[level - 1].colors[0] : sampler

            fbo.startMapping()

            gpu.activeTexture(gpu.TEXTURE0)
            gpu.bindTexture(gpu.TEXTURE_2D, previousColor)
            gpu.uniform1i(biLinearShaderUniforms.sampler, 0)

            gpu.uniform1f(biLinearShaderUniforms.downscaleStrength, 2)

            GPU.quad.draw()
            fbo.stopMapping()
        }

        blurShader.bind()
        for (let index = 0; index < upSampleBuffers.length ; index++) {
            const current = upSampleBuffers[index]
            current.startMapping()

            const currentColor = index === 0 ? blurBuffers[q-1].colors[0] : upSampleBuffers[index-1].colors[0]

            gpu.activeTexture(gpu.TEXTURE0)
            gpu.bindTexture(gpu.TEXTURE_2D, currentColor)
            gpu.uniform1i(blurShaderUniforms.sceneColor, 0)


            gpu.uniform1f(blurShaderUniforms.blurRadius, 4)
            gpu.uniform2fv(blurShaderUniforms.resolution, resolution)
            GPU.quad.draw()
            current.stopMapping()
        }



        gpu.bindFramebuffer(gpu.READ_FRAMEBUFFER, source.FBO);
        gpu.bindFramebuffer(gpu.DRAW_FRAMEBUFFER, targetFBO.FBO);
        gpu.blitFramebuffer(
            0, 0,
            source.width, source.height,
            0, 0,
            targetFBO.width, targetFBO.height,
            gpu.COLOR_BUFFER_BIT,
            gpu.LINEAR
        );
    }
}
