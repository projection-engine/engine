import GPUController from "../GPUController";
import STATIC_FRAMEBUFFERS from "../static/resources/STATIC_FRAMEBUFFERS";
import GPUResources from "../GPUResources";

export default function initializeFrameBuffers(){
    GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.CURRENT_FRAME, GPUResources.internalResolution.w, GPUResources.internalResolution.h).texture().depthTest()
    GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER, GPUResources.internalResolution.w, GPUResources.internalResolution.h).texture()
}