import * as ssGI from "../../../templates/shaders/SCREEN_SPACE.glsl"
import CameraAPI from "../../apis/CameraAPI";
import GPUResources from "../../../GPUResources";
import DeferredPass from "./DeferredPass";
import STATIC_FRAMEBUFFERS from "../../../static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../../static/resources/STATIC_SHADERS";
import GPUController from "../../../GPUController";


export default class SSRPass {
    static FBO
    static sampler
    static shader

    static rayMarchSettings = new Float32Array(3)
    static uniforms = {}
    static enabled = true

    static initialize() {
        SSRPass.FBO = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSR).texture({linear: true})
        SSRPass.shader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.SSR, ssGI.vShader, ssGI.fragment)
        SSRPass.sampler = SSRPass.FBO.colors[0]
        DeferredPass.deferredUniforms.screenSpaceReflections = SSRPass.sampler

        SSRPass.rayMarchSettings[0] = 100
        SSRPass.rayMarchSettings[1] = 5
        SSRPass.rayMarchSettings[2] = 1.2


        Object.assign(
            SSRPass.uniforms,
            {
                // previousFrame: ,
                // gPosition: DeferredPass.positionSampler,
                // gNormal: DeferredPass.normalSampler,
                // gBehaviour: DeferredPass.behaviourSampler,
                //
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