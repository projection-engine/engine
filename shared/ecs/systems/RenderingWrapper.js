import System from "../basic/System";
import DeferredSystem from "./DeferredSystem";
import SkyboxSystem from "./SkyboxSystem";
import GlobalIlluminationSystem from "./gi/GlobalIlluminationSystem";
import SYSTEMS from "../../templates/SYSTEMS";
import FramebufferInstance from "../../instances/FramebufferInstance";
import ForwardSystem from "./ForwardSystem";
import {copyTexture} from "../../utils/misc/utils";
import PostProcessingWrapper from "./postprocessing/PostProcessingWrapper";
import Shader from "../../utils/workers/Shader";
import * as shaderCode from "../../shaders/misc/postProcessing.glsl";


export default class RenderingWrapper extends System {
    constructor(gpu, resolutionMultiplier) {
        super([]);
        this.gpu = gpu
        this.frameBuffer = new FramebufferInstance(gpu, window.screen.width * resolutionMultiplier, window.screen.height * resolutionMultiplier)
        this.frameBuffer
            .texture()
            .depthTest()

        // this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.noFxaaShader = new Shader(shaderCode.vertex, shaderCode.noFxaaFragment, gpu)
        // this.FSRShader = new Shader(shaderCode.vertex, shaderCode.AMDFSR1, gpu)

        this.forwardSystem = new ForwardSystem(gpu)
        this.GISystem = new GlobalIlluminationSystem(gpu)
        this.skyboxSystem = new SkyboxSystem(gpu)
        this.deferredSystem = new DeferredSystem(gpu)


        this.postProcessingWrapper = new PostProcessingWrapper(gpu)
    }

    execute(options, systems, data, entities, entitiesMap, onWrap, [a, b]) {
        super.execute()
        const {
            pointLights,
            spotLights,
            skybox,
            directionalLights,
            cubeMaps,
            skylight,
        } = data
        const {
            camera,
            noRSM
        } = options

        this.GISystem.execute(systems[SYSTEMS.SHADOWS], skylight, noRSM)
        this.frameBuffer.startMapping()
        this.skyboxSystem.execute(skybox, camera)
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
        this.noFxaaShader.use()
        this.noFxaaShader.bindForUse({
            uSampler: this.frameBuffer.colors[0]
        })
        b.draw()

        copyTexture(a, systems[SYSTEMS.MESH].frameBuffer, this.gpu, this.gpu.DEPTH_BUFFER_BIT)

        this.forwardSystem.execute(options, systems, data, this.frameBuffer.colors[0])
        if (onWrap)
            onWrap.execute(options, systems, data, entities, entitiesMap, true)
        a.stopMapping()

        this.postProcessingWrapper.execute(options, systems, data, entities, entitiesMap, [a, b])
    }
}