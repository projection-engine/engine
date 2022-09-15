import * as ssGI from "../../shaders/SCREEN_SPACE.glsl"
import LoopAPI from "../../apis/rendering/LoopAPI";
import Engine from "../../Engine";
import CameraAPI from "../../apis/camera/CameraAPI";
import GPU from "../../GPU";
import DeferredPass from "./DeferredPass";
import STATIC_FRAMEBUFFERS from "../../../static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../../static/resources/STATIC_SHADERS";
import QuadAPI from "../../apis/rendering/QuadAPI";


export default class SSRPass {
    static FBO
    static sampler
    static shader
    static prevFrame

    static initialize() {
        SSRPass.FBO = GPU.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSR).texture()
        SSRPass.sampler = SSRPass.FBO.colors[0]
        SSRPass.shader =  GPU.allocateShader(STATIC_SHADERS.PRODUCTION.SSR, ssGI.vShader, ssGI.fragment)
        SSRPass.prevFrame = LoopAPI.previousFrame.colors[0]
    }

    static execute() {
        const {
            ssr,
            ssrStepSize,
            ssrMaxSteps
        } = Engine.params
        if (ssr) {
            SSRPass.FBO.startMapping()
            SSRPass.shader.bindForUse({
                previousFrame: SSRPass.prevFrame, // ALBEDO
                gPosition: DeferredPass.positionSampler,
                gNormal: DeferredPass.normalSampler,
                gBehaviour: DeferredPass.behaviourSampler,
                projection: CameraAPI.projectionMatrix,
                viewMatrix: CameraAPI.viewMatrix,
                invViewMatrix: CameraAPI.invViewMatrix,
                stepSize: ssrStepSize,
                maxSteps: ssrMaxSteps
            })
            QuadAPI.draw()
            SSRPass.FBO.stopMapping()
        }
    }
}