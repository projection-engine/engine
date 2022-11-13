import GPUAPI from "../lib/rendering/GPUAPI";
import STATIC_FRAMEBUFFERS from "../static/resources/STATIC_FRAMEBUFFERS";
import GPU from "../GPU";

import AmbientOcclusion from "../runtime/occlusion/AmbientOcclusion";
import GlobalIlluminationPass from "../runtime/rendering/GlobalIlluminationPass";
import GBuffer from "../runtime/rendering/GBuffer";
import MotionBlur from "../runtime/post-processing/MotionBlur";
import FrameComposition from "../runtime/post-processing/FrameComposition";
import ScreenEffectsPass from "../runtime/post-processing/ScreenEffectsPass";

export default function initializeFrameBuffers() {
    GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.CURRENT_FRAME, GPU.internalResolution.w, GPU.internalResolution.h).texture().depthTest()
    GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER, GPU.internalResolution.w, GPU.internalResolution.h).texture()

    GlobalIlluminationPass.normalsFBO = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI_NORMALS, GPU.samplerResolutions.GI.w, GPU.samplerResolutions.GI.h).texture()
    GlobalIlluminationPass.FBO = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI , GPU.samplerResolutions.GI.w, GPU.samplerResolutions.GI.h)
        .texture({attachment: 0})
        .texture({attachment: 1})
    console.log(GPU.samplerResolutions)
    AmbientOcclusion.framebuffer = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.AO_SRC, GPU.samplerResolutions.AO.w, GPU.samplerResolutions.AO.h)
        .texture({
            precision: gpu.R16F,
            format: gpu.RED,
            type: gpu.FLOAT,
        })
    AmbientOcclusion.blurredFBO = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.AO, GPU.samplerResolutions.AO.w, GPU.samplerResolutions.AO.h)
        .texture({
            precision: gpu.R16F,
            format: gpu.RED,
            type: gpu.FLOAT,
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
        .texture({precision: gpu.RGBA32F, attachment: 4}) // DEPTH
        .texture({attachment: 5}) // ID
        .texture({attachment: 6}) // BASE NORMAL
        .texture({attachment: 7, precision: gpu.RG32F, format: gpu.RG}) // gVelocity
        .depthTest()


    ScreenEffectsPass.baseFBO = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.BLUR_BLOOM).texture()

    ScreenEffectsPass.outputFBO = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER)
    ScreenEffectsPass.workerTexture = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.CURRENT_FRAME).colors[0]

}