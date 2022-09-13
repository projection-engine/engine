import * as ssGI from "../../shaders/SCREEN_SPACE.glsl"
import LoopController from "../../controllers/LoopController";
import Engine from "../../Engine";
import CameraAPI from "../../apis/CameraAPI";
import GPU from "../../GPU";
import DepthPass from "./DepthPass";
import DeferredPass from "../rendering/DeferredPass";
import STATIC_FRAMEBUFFERS from "../../../static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../../static/resources/STATIC_SHADERS";
import QuadAPI from "../../apis/QuadAPI";


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
        } = Engine.params
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
            QuadAPI.draw()
            SSRPass.FBO.stopMapping()
        }
    }
}