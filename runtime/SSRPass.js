import CameraAPI from "../api/CameraAPI";
import GPUResources from "../GPUResources";
import DeferredRenderer from "./renderers/DeferredRenderer";
import STATIC_FRAMEBUFFERS from "../static/resources/STATIC_FRAMEBUFFERS";
import GPUController from "../GPUController";

export default class SSRPass {
    static FBO
    static sampler
    static shader

    static rayMarchSettings = new Float32Array(3)
    static uniforms = {}
    static enabled = true

    static initialize() {
        SSRPass.FBO = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSR).texture({linear: true})

        SSRPass.sampler = SSRPass.FBO.colors[0]
        DeferredRenderer.deferredUniforms.screenSpaceReflections = SSRPass.sampler

        SSRPass.rayMarchSettings[0] = 100
        SSRPass.rayMarchSettings[1] = 5
        SSRPass.rayMarchSettings[2] = 1.2

        Object.assign(
            SSRPass.uniforms,
            {
                projection: CameraAPI.projectionMatrix,
                viewMatrix: CameraAPI.viewMatrix,
                invViewMatrix: CameraAPI.invViewMatrix,
                stepSize: .5,
                rayMarchSettings: SSRPass.rayMarchSettings
            })

    }

    static execute() {
        if (!SSRPass.enabled)
            return

        SSRPass.FBO.startMapping()
        SSRPass.shader.bindForUse(SSRPass.uniforms)
        GPUResources.quad.draw()
        SSRPass.FBO.stopMapping()
    }
}