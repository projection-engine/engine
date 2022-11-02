import GPUController from "../GPUController";
import STATIC_FRAMEBUFFERS from "../static/resources/STATIC_FRAMEBUFFERS";
import GPUResources from "../GPUResources";
import generateBlurBuffers from "./generate-blur-buffers";
import AmbientOcclusion from "../runtime/occlusion/AmbientOcclusion";
import GlobalIlluminationPass from "../runtime/GlobalIlluminationPass";
import GBuffer from "../runtime/renderers/GBuffer";
import MotionBlur from "../runtime/post-processing/MotionBlur";
import FrameComposition from "../runtime/post-processing/FrameComposition";

export default function initializeFrameBuffers() {
    const GI_SETTINGS = {
        linear: true,
        precision: gpu.RGBA,
        format: gpu.RGBA,
        type: gpu.UNSIGNED_BYTE
    }
    GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.CURRENT_FRAME, GPUResources.internalResolution.w, GPUResources.internalResolution.h).texture().depthTest()
    GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER, GPUResources.internalResolution.w, GPUResources.internalResolution.h).texture()

    GlobalIlluminationPass.normalsFBO = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI_NORMALS).texture()
    GlobalIlluminationPass.FBO = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI)
        .texture({...GI_SETTINGS, attachment: 0})
        .texture({...GI_SETTINGS, attachment: 1})

    const [blurBuffers, upSampledBuffers] = generateBlurBuffers(3, GPUResources.internalResolution.w, GPUResources.internalResolution.h, 2)
    GlobalIlluminationPass.blurBuffers = blurBuffers
    GlobalIlluminationPass.upSampledBuffers = upSampledBuffers


    AmbientOcclusion.framebuffer = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.AO_SRC)
        .texture({
            precision: gpu.R16F,
            format: gpu.RED,
            type: gpu.FLOAT,
            linear: false,
            repeat: false
        })
    AmbientOcclusion.blurredFBO = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.AO)
        .texture({
            precision: gpu.R16F,
            format: gpu.RED,
            type: gpu.FLOAT,
            linear: false,
            repeat: false
        })
    MotionBlur.frameBuffer = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.MOTION_BLUR).texture({linear: true})
    MotionBlur.workerTexture = GPUResources.frameBuffers.get(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER).colors[0]
    FrameComposition.workerTexture = MotionBlur.frameBuffer.colors[0]

    GBuffer.gBuffer = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.G_BUFFER)
        .texture({attachment: 0, precision: gpu.RGBA32F}) // POSITION
        .texture({attachment: 1}) // NORMAL
        .texture({attachment: 2, precision: gpu.RGBA, format: gpu.RGBA, type: gpu.UNSIGNED_BYTE}) // ALBEDO
        .texture({attachment: 3})
        .texture({
            precision: gpu.RGBA32F,
            format: gpu.RGBA,
            repeat: false,
            linear: false,
            attachment: 4
        }) // DEPTH
        .texture({attachment: 5}) // ID
        .texture({attachment: 6}) // BASE NORMAL
        .texture({attachment: 7, precision: gpu.RG16F, format: gpu.RG}) // gVelocity

        .depthTest()
    GBuffer.compositeFBO = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.DEFERRED_COMPOSITION).texture()
}