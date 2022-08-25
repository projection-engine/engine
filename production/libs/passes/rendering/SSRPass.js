import FramebufferInstance from "../../instances/FramebufferInstance"
import ShaderInstance from "../../instances/ShaderInstance"
import * as ssGI from "../../../data/shaders/SCREEN_SPACE.glsl"
import LoopAPI from "../../apis/LoopAPI";
import RendererController from "../../../RendererController";
import CameraAPI from "../../apis/CameraAPI";


let gNormal, deferredSystem, gPosition, gBehaviour
export default class SSRPass {
    constructor(resolution={w: window.screen.width, h: window.screen.height}) {
        this.FBO = (new FramebufferInstance(resolution.w, resolution.h)).texture()
        this.shader = new ShaderInstance(ssGI.vShader, ssGI.fragment)

    }

    get color(){
        return this.FBO.colors[0]
    }

    execute(currentFrame) {

        const {
            ssr,
            ssrStepSize,
            ssrMaxSteps
        } = RendererController.params
        if(ssr) {
            if(gNormal === undefined) {
                gNormal = LoopAPI.renderMap.get("depthPrePass").normal
                deferredSystem = LoopAPI.renderMap.get("deferred")
                gPosition = deferredSystem.frameBuffer.colors[0]
                gBehaviour = deferredSystem.frameBuffer.colors[3]
            }
            this.FBO.startMapping()
            this.shader.bindForUse({
                previousFrame: currentFrame, // ALBEDO
                gPosition,
                gNormal,
                gBehaviour,
                projection: CameraAPI.projectionMatrix,
                viewMatrix: CameraAPI.viewMatrix,
                invViewMatrix: CameraAPI.invViewMatrix,
                stepSize: ssrStepSize,
                maxSteps: ssrMaxSteps
            })
            this.FBO.draw()
            this.FBO.stopMapping()
        }
    }
}