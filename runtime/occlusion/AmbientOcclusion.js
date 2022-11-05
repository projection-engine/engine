import IMAGE_WORKER_ACTIONS from "../../static/IMAGE_WORKER_ACTIONS"
import GPU from "../../GPU";
import GBuffer from "../renderers/GBuffer";
import CameraAPI from "../../api/CameraAPI";
import GlobalIlluminationPass from "../GlobalIlluminationPass";
import ImageWorker from "../../workers/image/ImageWorker";
import UBO from "../../instances/UBO";

const RESOLUTION = 8
export default class AmbientOcclusion {
    static UBO
    static #ready = false
    static framebuffer
    static blurredFBO
    static filteredSampler
    static unfilteredSampler
    static shader
    static blurShader
    static noiseSampler
    static noiseScale = new Float32Array(2)
    static uniforms = {}

    static set settings(data) {
        AmbientOcclusion.UBO.bind()
        AmbientOcclusion.UBO.updateData("settings", new Float32Array(data))
        AmbientOcclusion.UBO.unbind()
    }

    static enabled = true

    static initialize() {
        AmbientOcclusion.unfilteredSampler = AmbientOcclusion.framebuffer.colors[0]
        AmbientOcclusion.filteredSampler = AmbientOcclusion.blurredFBO.colors[0]

        AmbientOcclusion.noiseScale[0] = GPU.internalResolution.w / RESOLUTION
        AmbientOcclusion.noiseScale[1] = GPU.internalResolution.h / RESOLUTION

        AmbientOcclusion.UBO = new UBO(
            "Settings",
            [
                {name: "settings", type: "vec3"},
                {name: "samples", type: "vec4", dataLength: 64},

                {name: "noiseScale", type: "vec2"}
            ]
        )

        CameraAPI.UBO.bindWithShader(AmbientOcclusion.shader.program)
        AmbientOcclusion.UBO.bindWithShader(AmbientOcclusion.shader.program)
        AmbientOcclusion.settings = [.5, .7, -.1]
        AmbientOcclusion.UBO.bind()
        AmbientOcclusion.UBO.updateData("noiseScale", AmbientOcclusion.noiseScale)
        AmbientOcclusion.UBO.unbind()

        ImageWorker.request(
            IMAGE_WORKER_ACTIONS.NOISE_DATA,
            {w: RESOLUTION, h: RESOLUTION}
        )
            .then(({kernels, noise}) => {
                AmbientOcclusion.UBO.bind()
                AmbientOcclusion.UBO.updateData("samples", kernels)
                AmbientOcclusion.UBO.unbind()

                AmbientOcclusion.noiseSampler = gpu.createTexture()
                gpu.bindTexture(gpu.TEXTURE_2D, AmbientOcclusion.noiseSampler)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.NEAREST)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.NEAREST)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.REPEAT)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.REPEAT)
                gpu.texStorage2D(gpu.TEXTURE_2D, 1, gpu.RG32F, RESOLUTION, RESOLUTION)
                gpu.texSubImage2D(gpu.TEXTURE_2D, 0, 0, 0, RESOLUTION, RESOLUTION, gpu.RG, gpu.FLOAT, noise)
                Object.assign(
                    AmbientOcclusion.uniforms,
                    {
                        gPosition: GBuffer.positionSampler,
                        gNormal: GBuffer.baseNormalSampler,
                        noiseSampler: AmbientOcclusion.noiseSampler,
                        sampler: AmbientOcclusion.unfilteredSampler
                    }
                )
                AmbientOcclusion.#ready = true
            })
    }


    static execute() {
        if (!AmbientOcclusion.enabled || !AmbientOcclusion.#ready)
            return
        AmbientOcclusion.framebuffer.startMapping()
        AmbientOcclusion.shader.bindForUse(AmbientOcclusion.uniforms)
        GPU.quad.draw()
        AmbientOcclusion.framebuffer.stopMapping()

        AmbientOcclusion.blurredFBO.startMapping()
        AmbientOcclusion.blurShader.bindForUse(AmbientOcclusion.uniforms)
        GPU.quad.draw()
        AmbientOcclusion.blurredFBO.stopMapping()
    }

}

