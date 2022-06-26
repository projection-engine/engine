import System from "../../basic/System"
import FramebufferInstance from "../../instances/FramebufferInstance"
import ShaderInstance from "../../instances/ShaderInstance"
import * as ssGI from "../../shaders/SCREEN_SPACE.glsl"


let normalSampler, deferredSystem, lastFrame
export default class SSRPass extends System {
    constructor(resolution={w: window.screen.width, h: window.screen.height}) {
        super()
        this.FBO = (new FramebufferInstance(resolution.w, resolution.h)).texture()
        this.shader = new ShaderInstance(ssGI.vShader, ssGI.fragment)
    }

    get color(){
        return this.FBO.colors[0]
    }

    execute(options) {
        if(!lastFrame)
            lastFrame = window.renderer.postProcessingPass.lastFrame
        const {
            camera,
            ssr
        } = options
        if(ssr) {
            if(normalSampler === undefined) {
                normalSampler = window.renderer.renderingPass.depthPrePass.normal
                deferredSystem = window.renderer.renderingPass.deferred
            }
            this.FBO.startMapping()
            this.shader.use()
            this.shader.bindForUse({
                previousFrame: lastFrame, // ALBEDO
                gPosition: deferredSystem.frameBuffer.colors[0],
                gNormal: normalSampler,
                gBehaviour: deferredSystem.frameBuffer.colors[3],
                projection: camera.projectionMatrix,
                viewMatrix: camera.viewMatrix,
                invViewMatrix: camera.invViewMatrix,
                stepSize: .1,
                maxSteps: 30
            })
            this.FBO.draw()
            this.FBO.stopMapping()
        }
    }
}