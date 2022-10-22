import * as shaderCode from "../../../templates/shaders/AO.glsl"
import Framebuffer from "../../instances/Framebuffer"
import IMAGE_WORKER_ACTIONS from "../../../static/IMAGE_WORKER_ACTIONS"
import GPUResources from "../../../GPUResources";
import STATIC_FRAMEBUFFERS from "../../../static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../../static/resources/STATIC_SHADERS";
import DeferredPass from "./DeferredPass";
import CameraAPI from "../../apis/CameraAPI";
import SSGIPass from "./SSGIPass";
import ImageWorker from "../../../workers/image/ImageWorker";
import GPUController from "../../../GPUController";

const w = 4, h = 4
export default class AOPass {
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
        AOPass.settings[0] = 100 // RADIUS
        AOPass.settings[1] = 2 // STRENGTH

        AOPass.framebuffer = new Framebuffer()
        AOPass.framebuffer
            .texture({
                precision: gpu.R32F,
                format: gpu.RED,
                type: gpu.FLOAT,
                linear: false,
                repeat: false
            })
        AOPass.unfilteredSampler = AOPass.framebuffer.colors[0]

        AOPass.blurredFBO = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.AO)
        AOPass.blurredFBO
            .texture({
                precision: gpu.R32F,
                format: gpu.RED,
                type: gpu.FLOAT,
                linear: false,
                repeat: false
            })
        AOPass.filteredSampler = AOPass.blurredFBO.colors[0]

        AOPass.shader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.AO, shaderCode.vertex, shaderCode.fragment)
        console.log(AOPass.shader)
        AOPass.blurShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.AO_BLUR, shaderCode.vertex, shaderCode.fragmentBlur)
        AOPass.noiseScale[0] = window.outerWidth / w
        AOPass.noiseScale[1] = window.outerHeight / h
        DeferredPass.deferredUniforms.aoSampler = AOPass.filteredSampler
        ImageWorker.request(IMAGE_WORKER_ACTIONS.NOISE_DATA, {w, h})
            .then(({kernels, noise}) => {
                AOPass.kernels = kernels
                AOPass.noiseSampler = gpu.createTexture()
                gpu.bindTexture(gpu.TEXTURE_2D, AOPass.noiseSampler)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.NEAREST)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.NEAREST)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.REPEAT)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.REPEAT)
                gpu.texStorage2D(gpu.TEXTURE_2D, 1, gpu.RG32F, w, h)
                gpu.texSubImage2D(gpu.TEXTURE_2D, 0, 0, 0, w, h, gpu.RG, gpu.FLOAT, noise)
                Object.assign(
                    AOPass.uniforms,
                    {
                        gPosition: DeferredPass.positionSampler,
                        gNormal: DeferredPass.normalSampler,
                        noiseSampler: AOPass.noiseSampler,
                        noiseScale: AOPass.noiseScale,
                        samples: AOPass.kernels,
                        projection: CameraAPI.projectionMatrix,
                        settings: AOPass.settings,
                        sampler: AOPass.unfilteredSampler // blur
                    }
                )
                SSGIPass.uniforms.noiseSampler = AOPass.noiseSampler
                SSGIPass.normalUniforms.noise = AOPass.noiseSampler
                AOPass.#ready = true

            })


    }


    static execute() {
        if (!AOPass.enabled || !AOPass.#ready)
            return
        AOPass.framebuffer.startMapping()
        AOPass.shader.bindForUse(AOPass.uniforms)
        GPUResources.quad.draw()
        AOPass.framebuffer.stopMapping()

        AOPass.blurredFBO.startMapping()
        AOPass.blurShader.bindForUse(AOPass.uniforms)
        GPUResources.quad.draw()
        AOPass.blurredFBO.stopMapping()
    }

}

