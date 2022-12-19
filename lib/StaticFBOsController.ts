import Controller from "../templates/Controller";
import GPU from "../GPU";
import GPUAPI from "./rendering/GPUAPI";
import STATIC_FRAMEBUFFERS from "../static/resources/STATIC_FRAMEBUFFERS";
import Framebuffer from "../instances/Framebuffer";
import DirectionalShadows from "../runtime/DirectionalShadows";
import ImageProcessor from "./math/ImageProcessor";
import IMAGE_WORKER_ACTIONS from "../static/IMAGE_WORKER_ACTIONS";
import SSAO from "../runtime/SSAO";

const RESOLUTION = 4

export default class StaticFBOsController extends Controller {
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

    static downscaleBloom: Framebuffer[]
    static upscaleBloom: Framebuffer[]

    static shadows?: Framebuffer
    static shadowsSampler?: WebGLTexture

    static noiseSampler?: WebGLTexture

    static initialize() {
        super.initialize()
        const context = GPU.context
        const halfResW = GPU.internalResolution.w / 2
        const halfResH = GPU.internalResolution.h / 2

        StaticFBOsController.visibility = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.VISIBILITY_BUFFER)
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

        StaticFBOsController.visibilityDepthSampler    = StaticFBOsController.visibility.colors[0]
        StaticFBOsController.visibilityEntitySampler  = StaticFBOsController.visibility.colors[1]
        StaticFBOsController.visibilityVelocitySampler  = StaticFBOsController.visibility.colors[2]

        StaticFBOsController.currentFrame = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.CURRENT_FRAME).texture()
        StaticFBOsController.currentFrameSampler = StaticFBOsController.currentFrame.colors[0]
        StaticFBOsController.TAACache = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.TAA_CACHE).texture()
        StaticFBOsController.cache = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.CHACHE_BUFFER).texture().depthTest()
        StaticFBOsController.ssgi = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI, halfResW, halfResH)
            .texture({
                attachment: 0,
                precision: context.RGB,
                format: context.RGB,
                type: context.UNSIGNED_BYTE,
                label: "SSGI"
            })
        StaticFBOsController.ssao = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.AO_SRC, halfResW, halfResH)
            .texture({
                precision: context.R8,
                format: context.RED,
                type: context.UNSIGNED_BYTE
            })
        StaticFBOsController.ssaoBlurred = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.AO, halfResW, halfResH)
            .texture({
                precision: context.R8,
                format: context.RED,
                type: context.UNSIGNED_BYTE
            })
        StaticFBOsController.mb = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.MOTION_BLUR).texture({linear: true})
        StaticFBOsController.lens = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.BLUR_BLOOM).texture()

        // StaticFBOsController.bokeh = GPUAPI.allocateFramebuffer("BOKEH").texture()

        StaticFBOsController.ssgiQuarter = GPUAPI.allocateFramebuffer(
            STATIC_FRAMEBUFFERS.SSGI + "QUARTER",
            GPU.internalResolution.w / 4,
            GPU.internalResolution.h / 4
        ).texture({linear: true})

        StaticFBOsController.ssgiEighth = GPUAPI.allocateFramebuffer(
            STATIC_FRAMEBUFFERS.SSGI + "EIGHTH",
            GPU.internalResolution.w / 8,
            GPU.internalResolution.h / 8
        ).texture({linear: true})

        StaticFBOsController.ssgiFinal = GPUAPI.allocateFramebuffer(
            STATIC_FRAMEBUFFERS.SSGI + "UPSCALE_HORIZONTAL",
        ).texture({linear: true})

        const Q = 7
        let w = GPU.internalResolution.w, h = GPU.internalResolution.h
        for (let i = 0; i < Q; i++) {
            w /= 2
            h /= 2
            StaticFBOsController.downscaleBloom.push(GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.SCREEN_EFFECTS + "DOWNSCALE" + i, w, h).texture({linear: true}))
        }
        for (let i = 0; i < (Q / 2 - 1); i++) {
            w *= 4
            h *= 4
            StaticFBOsController.upscaleBloom.push(GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.SCREEN_EFFECTS + "UPSCALE" + i, w, h).texture({linear: true}))
        }

        StaticFBOsController.updateDirectionalShadowsFBO()
    }

    static updateDirectionalShadowsFBO() {
        const context = GPU.context
        if (StaticFBOsController.shadows)
            context.deleteTexture(StaticFBOsController.shadows.depthSampler)
        StaticFBOsController.shadows = new Framebuffer(DirectionalShadows.maxResolution, DirectionalShadows.maxResolution).depthTexture()
        StaticFBOsController.shadowsSampler = StaticFBOsController.shadows.depthSampler
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
        StaticFBOsController.noiseSampler = context.createTexture()

        context.bindTexture(context.TEXTURE_2D, StaticFBOsController.noiseSampler)
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST)
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST)
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.REPEAT)
        context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.REPEAT)
        context.texStorage2D(context.TEXTURE_2D, 1, context.RG16F, RESOLUTION, RESOLUTION)
        context.texSubImage2D(context.TEXTURE_2D, 0, 0, 0, RESOLUTION, RESOLUTION, context.RG, context.FLOAT, noise)

    }
}