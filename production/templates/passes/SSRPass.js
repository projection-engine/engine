import * as ssGI from "../../data/shaders/SCREEN_SPACE.glsl"
import LoopController from "../../controllers/LoopController";
import RendererController from "../../controllers/RendererController";
import CameraAPI from "../../libs/CameraAPI";
import GPU from "../../controllers/GPU";
import DepthPass from "./DepthPass";
import DeferredPass from "./DeferredPass";
import STATIC_FRAMEBUFFERS from "../../../static/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../../static/STATIC_SHADERS";


export default class SSRPass {
    static FBO
    static sampler
    static shader
    static prevFrame

    static initialize() {
        SSRPass.FBO = GPU.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSR).texture()
        SSRPass.sampler = SSRPass.FBO.colors[0]
        SSRPass.shader =  GPU.allocateShader(STATIC_SHADERS.PRODUCTION.SSR, ssGI.vShader, ssGI.fragment)
        SSRPass.prevFrame = LoopController.previousFrame.colors[0]
    }

    static execute() {
        const {
            ssr,
            ssrStepSize,
            ssrMaxSteps
        } = RendererController.params
        if (ssr) {
            SSRPass.FBO.startMapping()
            SSRPass.shader.bindForUse({
                previousFrame: SSRPass.prevFrame, // ALBEDO
                gPosition: DeferredPass.positionSampler,
                gNormal: DepthPass.normal,
                gBehaviour: DeferredPass.behaviourSampler,
                projection: CameraAPI.projectionMatrix,
                viewMatrix: CameraAPI.viewMatrix,
                invViewMatrix: CameraAPI.invViewMatrix,
                stepSize: ssrStepSize,
                maxSteps: ssrMaxSteps
            })
            GPU.quad.draw()
            SSRPass.FBO.stopMapping()
        }
    }
}