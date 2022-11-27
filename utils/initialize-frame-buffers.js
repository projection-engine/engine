import GPUAPI from "../lib/rendering/GPUAPI";
import STATIC_FRAMEBUFFERS from "../static/resources/STATIC_FRAMEBUFFERS";
import GPU from "../GPU";
import SSGI from "../runtime/rendering/SSGI";

import MotionBlur from "../runtime/post-processing/MotionBlur";
import FrameComposition from "../runtime/post-processing/FrameComposition";
import LensPostProcessing from "../runtime/post-processing/LensPostProcessing";

export default function initializeFrameBuffers() {
    let halfResW = GPU.internalResolution.w / 2, halfResH = GPU.internalResolution.h / 2
    GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.VISIBILITY_BUFFER)
        .texture({
            attachment: 0,
            precision: gpu.RGBA32F,
            label: "DEPTH_ENTITY"
        })
        .texture({
            attachment: 1,
            label: "VELOCITY",
            precision: gpu.RG16F,
            type: gpu.FLOAT,
            format: gpu.RG,
        })
        .depthTest()

    GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.CURRENT_FRAME, GPU.internalResolution.w, GPU.internalResolution.h).texture().depthTest()
    GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER, GPU.internalResolution.w, GPU.internalResolution.h).texture().depthTest()

    GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI, halfResW, halfResH)
        .texture({
            attachment: 0,
            precision: gpu.RGB,
            format: gpu.RGB,
            type: gpu.UNSIGNED_BYTE,
            label: "SSGI"
        })
    GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSR).texture({
        attachment: 1,
        precision: gpu.RGBA8,
        type: gpu.UNSIGNED_BYTE,
        label: "SSR"
    })
    GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.AO_SRC, halfResW, halfResH)
        .texture({
            precision: gpu.R8,
            format: gpu.RED,
            type: gpu.UNSIGNED_BYTE
        })
    GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.AO, halfResW, halfResH)
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