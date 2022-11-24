import GPUAPI from "../lib/rendering/GPUAPI";
import STATIC_FRAMEBUFFERS from "../static/resources/STATIC_FRAMEBUFFERS";
import GPU from "../GPU";

import AmbientOcclusion from "../runtime/occlusion/AmbientOcclusion";
import GlobalIlluminationPass from "../runtime/rendering/GlobalIlluminationPass";
import GBuffer from "../runtime/rendering/GBuffer";
import MotionBlur from "../runtime/post-processing/MotionBlur";
import FrameComposition from "../runtime/post-processing/FrameComposition";
import LensPostProcessing from "../runtime/post-processing/LensPostProcessing";

export default function initializeFrameBuffers() {
    GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.VISIBILITY_BUFFER)
        .texture({attachment: 0, label: "POSITION"})
        .texture({attachment: 1, label: "NORMAL"})
        .texture({attachment: 2, label: "INSTANCE"})
        .texture({attachment: 3, label: "UV_MATERIAL"})
        .depthTest()


    GBuffer.gBuffer = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.G_BUFFER)
        .texture({attachment: 0, label: "ALBEDO"}) // ALBEDO
        .texture({attachment: 1, precision: gpu.RGBA8, type: gpu.UNSIGNED_BYTE, format: gpu.RGBA, label: "BEHAVIOUR"})

    GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.CURRENT_FRAME, GPU.internalResolution.w, GPU.internalResolution.h).texture().depthTest()
    GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER, GPU.internalResolution.w, GPU.internalResolution.h).texture().depthTest()

    GlobalIlluminationPass.FBO = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI)
        .texture({
            attachment: 0,
            precision: gpu.RGBA8,
            type: gpu.UNSIGNED_BYTE,
            label: "SSGI"
        })
        .texture({
            attachment: 1,
            precision: gpu.RGBA8,
            type: gpu.UNSIGNED_BYTE,
            label: "SSR"
        })
    AmbientOcclusion.framebuffer = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.AO_SRC, GPU.internalResolution.w / 2, GPU.internalResolution.h / 2)
        .texture({
            precision: gpu.R8,
            format: gpu.RED,
            type: gpu.UNSIGNED_BYTE
        })
    AmbientOcclusion.blurredFBO = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.AO, GPU.internalResolution.w / 2, GPU.internalResolution.h / 2)
        .texture({
            precision: gpu.R8,
            format: gpu.RED,
            type: gpu.UNSIGNED_BYTE
        })

    MotionBlur.frameBuffer = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.MOTION_BLUR).texture({linear: true})
    MotionBlur.workerTexture = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER).colors[0]
    FrameComposition.workerTexture = MotionBlur.frameBuffer.colors[0]


    LensPostProcessing.baseFBO = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.BLUR_BLOOM).texture()
    LensPostProcessing.outputFBO = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER)
    LensPostProcessing.workerTexture = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.CURRENT_FRAME).colors[0]

}