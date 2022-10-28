import IMAGE_WORKER_ACTIONS from "../../static/IMAGE_WORKER_ACTIONS"
import GPUResources from "../../GPUResources";
import GBuffer from "../renderers/GBuffer";
import CameraAPI from "../../api/CameraAPI";
import SSGIPass from "../SSGIPass";
import ImageWorker from "../../workers/image/ImageWorker";

const w = 4, h = 4
export default class AmbientOcclusion {
    static #ready = false
    static framebuffer
    static blurredFBO
    static filteredSampler
    static unfilteredSampler
    static shader
    static blurShader
    static kernels
    static noiseSampler
    static noiseScale = new Float32Array(2)
    static uniforms = {}
    static settings = new Float32Array(2)
    static enabled = true

    static initialize() {
        AmbientOcclusion.settings[0] = 100 // RADIUS
        AmbientOcclusion.settings[1] = 2 // STRENGTH


        AmbientOcclusion.unfilteredSampler = AmbientOcclusion.framebuffer.colors[0]

        AmbientOcclusion.filteredSampler = AmbientOcclusion.blurredFBO.colors[0]


        AmbientOcclusion.noiseScale[0] = window.outerWidth / w
        AmbientOcclusion.noiseScale[1] = window.outerHeight / h
        GBuffer.deferredUniforms.aoSampler = AmbientOcclusion.filteredSampler
        ImageWorker.request(IMAGE_WORKER_ACTIONS.NOISE_DATA, {w, h})
            .then(({kernels, noise}) => {
                AmbientOcclusion.kernels = kernels
                AmbientOcclusion.noiseSampler = gpu.createTexture()
                gpu.bindTexture(gpu.TEXTURE_2D, AmbientOcclusion.noiseSampler)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.NEAREST)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.NEAREST)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.REPEAT)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.REPEAT)
                gpu.texStorage2D(gpu.TEXTURE_2D, 1, gpu.RG32F, w, h)
                gpu.texSubImage2D(gpu.TEXTURE_2D, 0, 0, 0, w, h, gpu.RG, gpu.FLOAT, noise)
                Object.assign(
                    AmbientOcclusion.uniforms,
                    {
                        gPosition: GBuffer.positionSampler,
                        gNormal: GBuffer.baseNormalSampler,
                        noiseSampler: AmbientOcclusion.noiseSampler,
                        noiseScale: AmbientOcclusion.noiseScale,
                        samples: AmbientOcclusion.kernels,
                        projection: CameraAPI.projectionMatrix,
                        settings: AmbientOcclusion.settings,
                        sampler: AmbientOcclusion.unfilteredSampler // blur
                    }
                )
                SSGIPass.uniforms.noiseSampler = AmbientOcclusion.noiseSampler
                SSGIPass.normalUniforms.noise = AmbientOcclusion.noiseSampler
                AmbientOcclusion.#ready = true

            })
    }


    static execute() {
        if (!AmbientOcclusion.enabled || !AmbientOcclusion.#ready)
            return
        AmbientOcclusion.framebuffer.startMapping()
        AmbientOcclusion.shader.bindForUse(AmbientOcclusion.uniforms)
        GPUResources.quad.draw()
        AmbientOcclusion.framebuffer.stopMapping()

        AmbientOcclusion.blurredFBO.startMapping()
        AmbientOcclusion.blurShader.bindForUse(AmbientOcclusion.uniforms)
        GPUResources.quad.draw()
        AmbientOcclusion.blurredFBO.stopMapping()
    }

}

