import * as shaderCode from "../shaders/AO.glsl"
import FramebufferInstance from "../instances/FramebufferInstance"
import IMAGE_WORKER_ACTIONS from "../data/IMAGE_WORKER_ACTIONS"
import Engine from "../Engine";
import GPU from "../GPU";
import DepthPass from "./DepthPass";
import STATIC_FRAMEBUFFERS from "../../static/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../static/STATIC_SHADERS";
import QuadAPI from "../apis/QuadAPI";

export default class AOPass {
    static ready = false
    static framebuffer
    static blurredFBO
    static filteredSampler
    static unfilteredSampler
    static shader
    static blurShader
    static kernels
    static noiseTexture

    static initialize() {
        AOPass.framebuffer = new FramebufferInstance()
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


        GPU.imageWorker(IMAGE_WORKER_ACTIONS.NOISE_DATA, GPU.internalResolution)
            .then(({kernels, noise}) => {
                AOPass.kernels = kernels
                AOPass.noiseTexture = gpu.createTexture()
                gpu.bindTexture(gpu.TEXTURE_2D, AOPass.noiseTexture)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.NEAREST)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.NEAREST)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.REPEAT)
                gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.REPEAT)
                gpu.texStorage2D(gpu.TEXTURE_2D, 1, gpu.RG16F, GPU.internalResolution.w, GPU.internalResolution.h)
                gpu.texSubImage2D(gpu.TEXTURE_2D, 0, 0, 0, GPU.internalResolution.w, GPU.internalResolution.h, gpu.RG, gpu.FLOAT, noise)
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
                randomSampler: AOPass.noiseTexture,
                depthSampler: DepthPass.depth,
                settings: [
                    total_strength, base, area,
                    falloff, radius, samples,
                    0, 0, 0
                ],
                normalSampler: DepthPass.normal
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

