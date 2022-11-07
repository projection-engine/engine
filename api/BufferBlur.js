
import GPU from "../GPU";
import Framebuffer from "../instances/Framebuffer";
import GBuffer from "../runtime/renderers/GBuffer";
import GPUAPI from "./GPUAPI";


let blurShader, blurShaderUniforms, resolution = new Float32Array(2), source
export default class BufferBlur {
    static downSampleBuffers
    static upSampleBuffers

    static blurShader
    static upSamplingShader

    static initialize() {
        const [downSampleBuffers, upSampleBuffers] = BufferBlur.generateBuffers(4, GPU.internalResolution.w, GPU.internalResolution.h)
        BufferBlur.downSampleBuffers = downSampleBuffers
        BufferBlur.upSampleBuffers = upSampleBuffers

        resolution[0] = GPU.internalResolution.w
        resolution[1] = GPU.internalResolution.h

        source = upSampleBuffers[upSampleBuffers.length - 1]

        blurShader = BufferBlur.blurShader
        blurShaderUniforms = blurShader.uniformMap

    }

    static generateBuffers(quantity, w, h) {
        const downscaleStrength = 2
        const downSampleBuffers = [], upSampleBuffers = []

        let pW = w, pH = h
        for (let i = 0; i < quantity; i++) {
            const [wW, hH] = [pW / downscaleStrength, pH / downscaleStrength]
            downSampleBuffers.push(
                new Framebuffer(wW, hH).texture({linear: true})
            )
            pW = wW
            pH = hH
        }
        pW *= downscaleStrength
        pH *=downscaleStrength
        for (let i = 0; i < quantity - 1; i++) {
            const [wW, hH] = [pW * downscaleStrength, pH * downscaleStrength]
            upSampleBuffers.push(new Framebuffer(wW, hH).texture({linear: true}))
            pW = wW
            pH = hH
        }
        return [downSampleBuffers, upSampleBuffers]
    }

    static applyBlur(targetFBO, sampler, radius, bloomIntensity = 1) {
        const blurBuffers = BufferBlur.downSampleBuffers
        const upSampleBuffers = BufferBlur.upSampleBuffers
        const q = blurBuffers.length

        blurShader.bind()
        for (let level = 0; level < q; level++) {
            const fbo = blurBuffers[level]
            const previousColor = level > 0 ? blurBuffers[level - 1].colors[0] : sampler

            fbo.startMapping()
            gpu.activeTexture(gpu.TEXTURE0)
            gpu.bindTexture(gpu.TEXTURE_2D, previousColor)
            gpu.uniform1i(blurShaderUniforms.sceneColor, 0)

            gpu.uniform1f(blurShaderUniforms.blurRadius, radius)
            gpu.uniform2fv(blurShaderUniforms.resolution, resolution)
            GPU.quad.draw()
            fbo.stopMapping()
        }

        for (let index = 0; index < q -1; index++) {
            const current = upSampleBuffers[index]
            current.startMapping()
            BufferBlur.upSamplingShader.bindForUse({
                blurred: blurBuffers[index].colors[0],
                previousSampler: index > 0 ?  upSampleBuffers[index-1].colors[0] : blurBuffers[0].colors[0],
                bloomIntensity
            })
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
