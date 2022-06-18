import System from "../basic/System"
import SYSTEMS from "../templates/SYSTEMS"
import FramebufferInstance from "../instances/FramebufferInstance"
import ShaderInstance from "../instances/ShaderInstance"
import * as ssGI from "../shaders/SSGI.glsl"

export default class SSR extends System {
    constructor(gpu, resolution={w: window.screen.width, h: window.screen.height}) {
        super()
        this.gpu = gpu
        this.frameBuffer = new FramebufferInstance(gpu, resolution.w, resolution.h)
        this.frameBuffer.texture()
        this.shader = new ShaderInstance(ssGI.vShader, ssGI.fragment, gpu)
    }

    get ssColor(){
        return this.frameBuffer.colors[0]
    }
    execute(options, systems) {
        super.execute()
        const {
            camera,
            lastFrame
        } = options
        this.gpu.bindVertexArray(null)
        const deferredSystem = systems[SYSTEMS.MESH]
        this.frameBuffer.startMapping()
        this.shader.use()
        this.shader.bindForUse({
            previousFrame: lastFrame, // ALBEDO
            gPosition: deferredSystem.frameBuffer.colors[0],
            gNormal: deferredSystem.frameBuffer.colors[1],
            gBehaviour: deferredSystem.frameBuffer.colors[3],
            projection:camera.projectionMatrix,
            viewMatrix: camera.viewMatrix,
            invViewMatrix: camera.invViewMatrix
        })
        this.frameBuffer.draw()
        this.frameBuffer.stopMapping()
    }
}