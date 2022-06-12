import System from "../basic/System"
import DeferredSystem from "./DeferredSystem"
import SkyboxSystem from "./SkyboxSystem"
import GlobalIlluminationSystem from "./gi/GlobalIlluminationSystem"
import SYSTEMS from "../templates/SYSTEMS"
import FramebufferInstance from "../instances/FramebufferInstance"
import ForwardSystem from "./ForwardSystem"
import {copyTexture} from "../utils/utils"
import PostProcessingWrapper from "./postprocessing/PostProcessingWrapper"
import ShaderInstance from "../instances/ShaderInstance"
import * as shaderCode from "../shaders/FXAA.glsl"
import LineSystem from "./LineSystem"


export default class RenderingWrapper extends System {
    constructor(gpu, resolution={w: window.screen.width, h: window.screen.height}) {
        super()
        this.gpu = gpu
        this.frameBuffer = new FramebufferInstance(gpu, resolution.w, resolution.h)
        this.frameBuffer
            .texture()
            .depthTest()

        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.noFxaaFragment, gpu)
        this.forwardSystem = new ForwardSystem(gpu)
        this.GISystem = new GlobalIlluminationSystem(gpu)
        this.skyboxSystem = new SkyboxSystem(gpu)
        this.lineSystem = new LineSystem(gpu)
        this.deferredSystem = new DeferredSystem(gpu)


        this.postProcessingWrapper = new PostProcessingWrapper(gpu, resolution)
    }

    execute(options, systems, data, entities, entitiesMap, onWrap, {a, b}) {
        super.execute()
        const {
            skylight,
        } = data
        const {
            noRSM
        } = options

        this.GISystem.execute(systems[SYSTEMS.SHADOWS], skylight, noRSM)
        this.frameBuffer.startMapping()

        this.skyboxSystem.execute(data, options)

        let giFBO, giGridSize
        if (!noRSM && skylight) {
            giGridSize = this.GISystem.size
            giFBO = this.GISystem.accumulatedBuffer
        }

        if (onWrap)
            onWrap.execute(options, systems, data, entities, entitiesMap, false)
        this.deferredSystem.execute(options, systems, data, giGridSize, giFBO)
        this.frameBuffer.stopMapping()

        a.startMapping()
        this.shader.use()
        this.shader.bindForUse({
            uSampler: this.frameBuffer.colors[0]
        })
        b.draw()

        copyTexture(a, systems[SYSTEMS.MESH].frameBuffer, this.gpu, this.gpu.DEPTH_BUFFER_BIT)

        this.forwardSystem.execute(options, systems, data, this.frameBuffer.colors[0])
        this.lineSystem.execute(options, data)
        if (onWrap)
            onWrap.execute(options, systems, data, entities, entitiesMap, true)
        a.stopMapping()

        this.postProcessingWrapper.execute(options, systems, data, entities, entitiesMap, [a, b])
    }
}