import GPUAPI from "../api/GPUAPI";
import STATIC_FRAMEBUFFERS from "../static/resources/STATIC_FRAMEBUFFERS";
import GPU from "../GPU";
import generateBlurBuffers from "./generate-blur-buffers";
import AmbientOcclusion from "../runtime/occlusion/AmbientOcclusion";
import GlobalIlluminationPass from "../runtime/GlobalIlluminationPass";
import GBuffer from "../runtime/renderers/GBuffer";
import MotionBlur from "../runtime/post-processing/MotionBlur";
import FrameComposition from "../runtime/post-processing/FrameComposition";
import ScreenEffectsPass from "../runtime/post-processing/ScreenEffectsPass";

export default function initializeFrameBuffers() {
    GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.CURRENT_FRAME, GPU.internalResolution.w, GPU.internalResolution.h).texture().depthTest()
    GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER, GPU.internalResolution.w, GPU.internalResolution.h).texture()

    GlobalIlluminationPass.normalsFBO = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI_NORMALS).texture()
    GlobalIlluminationPass.FBO = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI)
        .texture({attachment: 0})
        .texture({attachment: 1})

    const [blurBuffers, upSampledBuffers] = generateBlurBuffers(3, GPU.internalResolution.w, GPU.internalResolution.h, 2)
    GlobalIlluminationPass.blurBuffers = blurBuffers
    GlobalIlluminationPass.upSampledBuffers = upSampledBuffers


    AmbientOcclusion.framebuffer = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.AO_SRC)
        .texture({
            precision: gpu.R16F,
            format: gpu.RED,
            type: gpu.FLOAT,
            linear: false,
            repeat: false
        })
    AmbientOcclusion.blurredFBO = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.AO)
        .texture({
            precision: gpu.R16F,
            format: gpu.RED,
            type: gpu.FLOAT,
            linear: false,
            repeat: false
        })
    MotionBlur.frameBuffer = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.MOTION_BLUR).texture({linear: true})
    MotionBlur.workerTexture = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER).colors[0]
    FrameComposition.workerTexture = MotionBlur.frameBuffer.colors[0]

    GBuffer.gBuffer = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.G_BUFFER)
        .texture({attachment: 0, precision: gpu.RGBA32F}) // POSITION
        .texture({attachment: 1}) // NORMAL
        .texture({attachment: 2}) // ALBEDO
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
    GBuffer.compositeFBO = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.DEFERRED_COMPOSITION).texture()

    const ssEffects = generateBlurBuffers(4, GPU.internalResolution.w, GPU.internalResolution.h)
    ScreenEffectsPass.blurred = ssEffects[1][ssEffects[0].length - 2].colors[0]
    ScreenEffectsPass.blurBuffers = ssEffects[0]
    ScreenEffectsPass.upSampledBuffers = ssEffects[1]

    ScreenEffectsPass.outputFBO = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER)
    ScreenEffectsPass.workerTexture = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.CURRENT_FRAME).colors[0]

}