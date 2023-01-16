import GPU from "../GPU";
import Framebuffer from "../instances/Framebuffer";
import DirectionalShadows from "../runtime/DirectionalShadows";
import ImageProcessor from "./math/ImageProcessor";
import IMAGE_WORKER_ACTIONS from "../static/IMAGE_WORKER_ACTIONS";
import StaticUBOs from "./StaticUBOs";

const RESOLUTION = 4

export default class StaticFBO {
    static visibility?: Framebuffer
    static visibilityDepthSampler?: WebGLTexture
    static visibilityEntitySampler?: WebGLTexture
    static visibilityVelocitySampler?: WebGLTexture

    static lens?: Framebuffer
    static lensSampler?: WebGLTexture

    static postProcessing1?: Framebuffer
    static postProcessing1Sampler?: WebGLTexture

    static postProcessing2?: Framebuffer
    static postProcessing2Sampler?: WebGLTexture

    static TAACache?: Framebuffer
    static TAACacheSampler?: WebGLTexture



    static ssgi?: Framebuffer
    static ssgiSampler?: WebGLTexture
    static ssgiQuarter?: Framebuffer
    static ssgiEighth?: Framebuffer

    static ssao?: Framebuffer
    static ssaoSampler?: WebGLTexture

    static ssaoBlurred?: Framebuffer
    static ssaoBlurredSampler?: WebGLTexture

    static mb?: Framebuffer
    static mbSampler?: WebGLTexture

    static downscaleBloom: Framebuffer[] = []
    static upscaleBloom: Framebuffer[] = []

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


        StaticFBO.postProcessing1 = new Framebuffer().texture().depthTest()
        StaticFBO.postProcessing2 = new Framebuffer().texture().depthTest()

        // StaticFBO.TAACache = (new Framebuffer()).texture()
        // StaticFBO.TAACacheSampler = StaticFBO.TAACache.colors[0]

        const SSGI_SETTINGS = {
            linear: true,
            precision: context.RGB,
            format: context.RGB,
            type: context.UNSIGNED_BYTE
        }
        StaticFBO.ssgi = new Framebuffer(halfResW, halfResH)
            .texture(SSGI_SETTINGS)
        StaticFBO.ssgiQuarter = (new Framebuffer(
            GPU.internalResolution.w / 4,
            GPU.internalResolution.h / 4
        )).texture(SSGI_SETTINGS)

        StaticFBO.ssgiEighth = (new Framebuffer(
            GPU.internalResolution.w / 8,
            GPU.internalResolution.h / 8
        )).texture(SSGI_SETTINGS)


        const SSAO_SETTINGS = {
            precision: context.R8,
            format: context.RED,
            type: context.UNSIGNED_BYTE
        }
        StaticFBO.ssao = new Framebuffer(halfResW, halfResH).texture(SSAO_SETTINGS)
        StaticFBO.ssaoBlurred = new Framebuffer(halfResW, halfResH).texture(SSAO_SETTINGS)
        StaticFBO.lens = new Framebuffer().texture()


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

        StaticFBO.ssaoBlurredSampler = StaticFBO.ssaoBlurred.colors[0]
        StaticFBO.ssaoSampler = StaticFBO.ssao.colors[0]
        StaticFBO.ssgiSampler = StaticFBO.ssgi.colors[0]
        StaticFBO.visibilityDepthSampler = StaticFBO.visibility.colors[0]
        StaticFBO.visibilityEntitySampler = StaticFBO.visibility.colors[1]
        StaticFBO.visibilityVelocitySampler = StaticFBO.visibility.colors[2]
        StaticFBO.postProcessing1Sampler = StaticFBO.postProcessing1.colors[0]
        StaticFBO.postProcessing2Sampler = StaticFBO.postProcessing2.colors[0]
        StaticFBO.lensSampler = StaticFBO.lens.colors[0]

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

        StaticUBOs.ssaoUBO.bind()
        StaticUBOs.ssaoUBO.updateData("samples", kernels)
        StaticUBOs.ssaoUBO.unbind()
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