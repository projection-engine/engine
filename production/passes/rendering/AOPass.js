import * as shaderCode from "../../shaders/AO.glsl"
import FramebufferController from "../../instances/FramebufferController"
import IMAGE_WORKER_ACTIONS from "../../../static/IMAGE_WORKER_ACTIONS"
import Engine from "../../Engine";
import GPU from "../../GPU";
import DepthPass from "./DepthPass";
import STATIC_FRAMEBUFFERS from "../../../static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../../static/resources/STATIC_SHADERS";
import QuadAPI from "../../apis/rendering/QuadAPI";

export default class AOPass {
    static ready = false
    static framebuffer
    static blurredFBO
    static filteredSampler
    static unfilteredSampler
    static shader
    static blurShader
    static kernels
    static noiseSampler

    static initialize() {
        AOPass.framebuffer = new FramebufferController()
        AOPass.framebuffer
            .texture({
                precision: gpu.R32F,
                format: gpu.RED,
                type: gpu.FLOAT,
                linear: false,
                repeat: false
            })
        AOPass.unfilteredSampler = AOPass.framebuffer.colors[0]

        AOPass.blurredFBO = GPU.allocateFramebuffer(STATIC_FRAMEBUFFERS.AO)
        AOPass.blurredFBO
            .texture({
                precision: gpu.R32F,
                format: gpu.RED,
                type: gpu.FLOAT,
                linear: false,
                repeat: false
            })
        AOPass.filteredSampler = AOPass.blurredFBO.colors[0]

        AOPass.shader = GPU.allocateShader(STATIC_SHADERS.PRODUCTION.AO, shaderCode.vertex, shaderCode.fragment)
        AOPass.blurShader = GPU.allocateShader(STATIC_SHADERS.PRODUCTION.AO_BLUR, shaderCode.vertex, shaderCode.fragmentBlur)

        const w = GPU.internalResolution.w / 4, h = GPU.internalResolution.h / 4
        GPU.imageWorker(IMAGE_WORKER_ACTIONS.NOISE_DATA, GPU.internalResolution)
            .then(({kernels, noise}) => {
                AOPass.kernels = kernels
                AOPass.noiseSampler = gpu.createTexture()
                gpu.bindTexture(gpu.TEXTURE_2D, AOPass.noiseSampler)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.NEAREST)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.NEAREST)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.REPEAT)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.REPEAT)
                gpu.texStorage2D(gpu.TEXTURE_2D, 1, gpu.RGBA16F, w, h)
                gpu.texSubImage2D(gpu.TEXTURE_2D, 0, 0, 0, w, h, gpu.RGBA, gpu.FLOAT, noise)
                AOPass.ready = true
            })
    }


    static execute() {
        const {
            total_strength, base, area,
            falloff, radius, samples,
            ao
        } = Engine.params
        if (ao && AOPass.ready) {

            AOPass.framebuffer.startMapping()
            AOPass.shader.bindForUse({
                randomSampler: AOPass.noiseSampler,
                depthSampler: DepthPass.depthSampler,
                settings: [
                    total_strength, base, area,
                    falloff, radius, samples,
                    0, 0, 0
                ],
                normalSampler: DepthPass.normalSampler
            })
            QuadAPI.draw()
            AOPass.framebuffer.stopMapping()


            AOPass.blurredFBO.startMapping()
            AOPass.blurShader.bindForUse({
                aoSampler: AOPass.unfilteredSampler
            })
            QuadAPI.draw()
            AOPass.blurredFBO.stopMapping()
        }
    }

}

