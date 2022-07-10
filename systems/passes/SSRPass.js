import FramebufferInstance from "../../instances/FramebufferInstance"
import ShaderInstance from "../../instances/ShaderInstance"
import * as ssGI from "../../shaders/SCREEN_SPACE.glsl"


let gNormal, deferredSystem, gPosition, gBehaviour
export default class SSRPass {
    constructor(resolution={w: window.screen.width, h: window.screen.height}) {
        this.FBO = (new FramebufferInstance(resolution.w, resolution.h)).texture()
        this.shader = new ShaderInstance(ssGI.vShader, ssGI.fragment)

    }

    get color(){
        return this.FBO.colors[0]
    }

    execute(options, currentFrame) {

        const {
            camera,
            ssr,
            ssrStepSize,
            ssrMaxSteps
        } = options
        if(ssr) {
            if(gNormal === undefined) {
                gNormal = window.renderer.renderingPass.depthPrePass.normal
                deferredSystem = window.renderer.renderingPass.deferred
                gPosition = deferredSystem.frameBuffer.colors[0]
                gBehaviour = deferredSystem.frameBuffer.colors[3]
            }
            this.FBO.startMapping()
            this.shader.use()
            this.shader.bindForUse({
                previousFrame: currentFrame, // ALBEDO
                gPosition,
                gNormal,
                gBehaviour,
                projection: camera.projectionMatrix,
                viewMatrix: camera.viewMatrix,
                invViewMatrix: camera.invViewMatrix,
                stepSize: ssrStepSize,
                maxSteps: ssrMaxSteps
            })
            this.FBO.draw()
            this.FBO.stopMapping()
        }
    }
}