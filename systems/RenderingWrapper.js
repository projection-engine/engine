import System from "../basic/System"
import SYSTEMS from "../templates/SYSTEMS"
import FramebufferInstance from "../instances/FramebufferInstance"
import Forward from "./Forward"
import {copyTexture} from "../utils/utils"
import ShaderInstance from "../instances/ShaderInstance"
import * as shaderCode from "../shaders/FXAA.glsl"
import LineSystem from "./LineSystem"
import ENVIRONMENT from "../ENVIRONMENT"


export default class RenderingWrapper extends System {
    constructor(resolution={w: window.screen.width, h: window.screen.height}) {
        super()
        this.frameBuffer = new FramebufferInstance(resolution.w, resolution.h)
        this.frameBuffer
            .texture()
            .depthTest()

        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.noFxaaFragment)
        this.forwardSystem = new Forward()
        this.lineSystem = new LineSystem()

    }

    execute(options, systems, data, entities, entitiesMap, onWrap, {a, b}) {
        super.execute()
        const isProd = window.renderer.environment === ENVIRONMENT.PROD
        this.frameBuffer.startMapping()

        if (onWrap && !isProd)
            onWrap.execute(options, systems, data, entities, entitiesMap, false)

        systems[SYSTEMS.MESH].drawBuffer(options, systems, data)
        this.frameBuffer.stopMapping()

        a.startMapping()
        this.shader.use()
        this.shader.bindForUse({
            uSampler: this.frameBuffer.colors[0]
        })
        a.draw()

        copyTexture(a, systems[SYSTEMS.MESH].frameBuffer,  window.gpu.DEPTH_BUFFER_BIT)

        this.forwardSystem.execute(options, systems, data, this.frameBuffer.colors[0])
        this.lineSystem.execute(options, data)

        if (onWrap && !isProd)
            onWrap.execute(options, systems, data, entities, entitiesMap, true)

        a.stopMapping()

        window.renderer.postProcessingWrapper.execute(options, systems, data, entities, entitiesMap, [a, b])
    }
}