import GPUController from "../GPUController";
import STATIC_FRAMEBUFFERS from "../static/resources/STATIC_FRAMEBUFFERS";
import GPUResources from "../GPUResources";
import generateBlurBuffers from "./generate-blur-buffers";
import AmbientOcclusion from "../runtime/occlusion/AmbientOcclusion";
import SSGIPass from "../runtime/SSGIPass";
import SSRPass from "../runtime/SSRPass";
import GBuffer from "../runtime/renderers/GBuffer";

export default function initializeFrameBuffers() {
    GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.CURRENT_FRAME, GPUResources.internalResolution.w, GPUResources.internalResolution.h).texture().depthTest()
    GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER, GPUResources.internalResolution.w, GPUResources.internalResolution.h).texture()

    SSGIPass.normalsFBO = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI_NORMALS).texture()
    SSGIPass.FBO = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI).texture({
        linear: true,
         // precision: gpu.RGBA, format: gpu.RGBA, type: gpu.UNSIGNED_BYTE
    })
    const [blurBuffers, upSampledBuffers] = generateBlurBuffers(3, GPUResources.internalResolution.w, GPUResources.internalResolution.h, 2)
    SSGIPass.blurBuffers = blurBuffers
    SSGIPass.upSampledBuffers = upSampledBuffers

    SSRPass.FBO = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSR).texture({linear: true})

    AmbientOcclusion.framebuffer = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.AO_SRC)
        .texture({
            precision: gpu.R32F,
            format: gpu.RED,
            type: gpu.FLOAT,
            linear: false,
            repeat: false
        })
    AmbientOcclusion.blurredFBO = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.AO)
        .texture({
            precision: gpu.R32F,
            format: gpu.RED,
            type: gpu.FLOAT,
            linear: false,
            repeat: false
        })

    GBuffer.gBuffer = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.G_BUFFER)
        .texture({attachment: 0, precision: gpu.RGBA32F})
        .texture({attachment: 1})
        .texture({attachment: 2, precision: gpu.RGBA, format: gpu.RGBA, type: gpu.UNSIGNED_BYTE})
        .texture({attachment: 3})
        .texture({attachment: 4})
        .texture({
            precision: gpu.RGBA32F,
            format: gpu.RGBA,
            repeat: false,
            linear: false,
            attachment: 5
        }) // DEPTH
        .texture({attachment: 6}) // ID
        .texture({attachment: 7}) // BASE NORMAL
        .depthTest()
    GBuffer.compositeFBO = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.DEFERRED_COMPOSITION).texture()
}