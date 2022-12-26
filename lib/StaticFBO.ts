import GPU from "../GPU";
import Framebuffer from "../instances/Framebuffer";
import DirectionalShadows from "../runtime/DirectionalShadows";
import ImageProcessor from "./math/ImageProcessor";
import IMAGE_WORKER_ACTIONS from "../static/IMAGE_WORKER_ACTIONS";
import SSAO from "../runtime/SSAO";

const RESOLUTION = 4

export default class StaticFBO  {
    static visibility?: Framebuffer
    static visibilityDepthSampler?: WebGLTexture
    static visibilityEntitySampler?: WebGLTexture
    static visibilityVelocitySampler?: WebGLTexture

    static lens?: Framebuffer

    static bokeh?: Framebuffer
    static bokehSampler?: WebGLTexture

    static currentFrame?: Framebuffer
    static currentFrameSampler?: WebGLTexture

    static TAACache?: Framebuffer
    static TAACacheSampler?: WebGLTexture

    static cache?: Framebuffer
    static cacheSampler?: WebGLTexture

    static ssgi?: Framebuffer
    static ssgiSampler?: WebGLTexture

    static ssgiQuarter?: Framebuffer

    static ssgiEighth?: Framebuffer

    static ssgiFinal?: Framebuffer
    static ssgiFinalSampler?: WebGLTexture

    static ssao?: Framebuffer
    static ssaoSampler?: WebGLTexture

    static ssaoBlurred?: Framebuffer
    static ssaoBlurredSampler?: WebGLTexture

    static mb?: Framebuffer
    static mbSampler?: WebGLTexture

    static downscaleBloom: Framebuffer[] = []
    static upscaleBloom: Framebuffer[]= []

    static shadows?: Framebuffer
    static shadowsSampler?: WebGLTexture

    static noiseSampler?: WebGLTexture
static #initialized = false
    static initialize() {
        if (StaticFBO.#initialized)
            return
        StaticFBO.#initialized = true
        const context = GPU.context
        const halfResW = GPU.internalResolution.w / 2
        const halfResH = GPU.internalResolution.h / 2

        StaticFBO.visibility = (new Framebuffer())
            .texture({
                attachment: 0,
                precision: context.R32F,
                format: context.RED,
                label: "DEPTH"
            })
            .texture({
                attachment: 1,
                label: "ENTITY_ID"
            })
            .texture({
                attachment: 2,
                label: "VELOCITY",
                precision: context.RG16F,
                type: context.FLOAT,
                format: context.RG,
            })
            .depthTest()

        StaticFBO.visibilityDepthSampler = StaticFBO.visibility.colors[0]
        StaticFBO.visibilityEntitySampler = StaticFBO.visibility.colors[1]
        StaticFBO.visibilityVelocitySampler = StaticFBO.visibility.colors[2]

        StaticFBO.currentFrame = (new Framebuffer()).texture()
        StaticFBO.currentFrameSampler = StaticFBO.currentFrame.colors[0]
        StaticFBO.TAACache = (new Framebuffer()).texture()
        StaticFBO.TAACacheSampler = StaticFBO.TAACache.colors[0]

        StaticFBO.cache = (new Framebuffer()).texture().depthTest()
        StaticFBO.cacheSampler = StaticFBO.cache.colors[0]
        StaticFBO.ssgi = (new Framebuffer(halfResW, halfResH))
            .texture({
                attachment: 0,
                precision: context.RGB,
                format: context.RGB,
                type: context.UNSIGNED_BYTE,
                label: "SSGI"
            })
        StaticFBO.ssgiSampler = StaticFBO.ssgi.colors[0]

        StaticFBO.ssao = (new Framebuffer(halfResW, halfResH))
            .texture({
                precision: context.R8,
                format: context.RED,
                type: context.UNSIGNED_BYTE
            })
        StaticFBO.ssaoSampler = StaticFBO.ssao.colors[0]

        StaticFBO.ssaoBlurred = (new Framebuffer(halfResW, halfResH))
            .texture({
                precision: context.R8,
                format: context.RED,
                type: context.UNSIGNED_BYTE
            })
        StaticFBO.ssaoBlurredSampler = StaticFBO.ssaoBlurred.colors[0]

        StaticFBO.mb = (new Framebuffer()).texture({linear: true})
        StaticFBO.mbSampler = StaticFBO.mb.colors[0]
        StaticFBO.lens = (new Framebuffer()).texture()

        // StaticFBOsController.bokeh = GPUAPI.allocateFramebuffer("BOKEH").texture()

        StaticFBO.ssgiQuarter = (new Framebuffer(
            GPU.internalResolution.w / 4,
            GPU.internalResolution.h / 4
        )).texture({linear: true})

        StaticFBO.ssgiEighth = (new Framebuffer(
            GPU.internalResolution.w / 8,
            GPU.internalResolution.h / 8
        )).texture({linear: true})

        StaticFBO.ssgiFinal = (new Framebuffer()).texture({linear: true})
        StaticFBO.ssgiFinalSampler = StaticFBO.ssgiFinal.colors[0]
        const Q = 7
        let w = GPU.internalResolution.w, h = GPU.internalResolution.h
        for (let i = 0; i < Q; i++) {
            w /= 2
            h /= 2
            StaticFBO.downscaleBloom.push((new Framebuffer(w, h)).texture({linear: true}))
        }
        for (let i = 0; i < (Q / 2 - 1); i++) {
            w *= 4
            h *= 4
            StaticFBO.upscaleBloom.push((new Framebuffer(w, h)).texture({linear: true}))
        }

        StaticFBO.updateDirectionalShadowsFBO()
    }

    static updateDirectionalShadowsFBO() {
        const context = GPU.context
        if (StaticFBO.shadows)
            context.deleteTexture(StaticFBO.shadows.depthSampler)
        StaticFBO.shadows = new Framebuffer(DirectionalShadows.maxResolution, DirectionalShadows.maxResolution).depthTexture()
        StaticFBO.shadowsSampler = StaticFBO.shadows.depthSampler
    }

    static async generateSSAONoise() {
        const context = GPU.context
        const {kernels, noise} = await ImageProcessor.request(
            IMAGE_WORKER_ACTIONS.NOISE_DATA,
            {w: RESOLUTION, h: RESOLUTION}
        )

        SSAO.UBO.bind()
        SSAO.UBO.updateData("samples", kernels)
        SSAO.UBO.unbind()
        StaticFBO.noiseSampler = context.createTexture()

        context.bindTexture(context.TEXTURE_2D, StaticFBO.noiseSampler)
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST)
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST)
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.REPEAT)
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.REPEAT)
        context.texStorage2D(context.TEXTURE_2D, 1, context.RG16F, RESOLUTION, RESOLUTION)
        context.texSubImage2D(context.TEXTURE_2D, 0, 0, 0, RESOLUTION, RESOLUTION, context.RG, context.FLOAT, noise)

    }
}