import System from "../basic/System";
import DeferredSystem from "./rendering/DeferredSystem";
import SkyboxSystem from "./rendering/SkyboxSystem";
import GlobalIlluminationSystem from "./rendering/gi/GlobalIlluminationSystem";
import SYSTEMS from "../../templates/SYSTEMS";
import Shader from "../../utils/workers/Shader";

import * as shaderCode from '../../shaders/misc/postProcessing.glsl'
import FramebufferInstance from "../../instances/FramebufferInstance";
import ForwardSystem from "./rendering/ForwardSystem";
import {copyTexture} from "../../utils/misc/utils";
import RENDERING_TYPES from "../../templates/RENDERING_TYPES";


export default class RenderingWrapper extends System {
    constructor(gpu, resolutionMultiplier) {
        super([]);
        this.gpu = gpu
        this.frameBuffer = new FramebufferInstance(gpu, window.screen.width * resolutionMultiplier, window.screen.height * resolutionMultiplier)
        this.frameBuffer
            .texture()
            .depthTest()

        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.noFxaaShader = new Shader(shaderCode.vertex, shaderCode.noFxaaFragment, gpu)
        this.FSRShader = new Shader(shaderCode.vertex, shaderCode.AMDFSR1, gpu)

        this.forwardSystem = new ForwardSystem(gpu)
        this.GISystem = new GlobalIlluminationSystem(gpu)
        this.skyboxSystem = new SkyboxSystem(gpu)
        this.deferredSystem = new DeferredSystem(gpu)
    }

    execute(options, systems, data, entities, entitiesMap, onWrap) {
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
            typeRendering,
            shadingModel,
            noRSM,
            gamma,
            exposure
        } = options

        this.GISystem.execute(systems[SYSTEMS.SHADOWS], skylight, noRSM)
        this.frameBuffer.startMapping()
        this.skyboxSystem.execute(skybox, camera)

        let giFBO, giGridSize
        if (!noRSM && skylight) {
            giGridSize = this.GISystem.size
            giFBO = this.GISystem.accumulatedBuffer
        }

        if(onWrap)
            onWrap.execute(options, systems, data, entities, entitiesMap, false)
        this.deferredSystem.execute(skybox, pointLights, directionalLights, spotLights, cubeMaps, camera, shadingModel, systems, giFBO, giGridSize, skylight, gamma, exposure)
        copyTexture(this.frameBuffer, systems[SYSTEMS.MESH].frameBuffer, this.gpu, this.gpu.DEPTH_BUFFER_BIT)
        if(onWrap)
            onWrap.execute(options, systems, data, entities, entitiesMap, true)

        this.forwardSystem.execute(options, systems, data, entities, entitiesMap)
        this.frameBuffer.stopMapping()

        let shaderToApply
        switch (typeRendering) {
            case RENDERING_TYPES.FSR:
                shaderToApply = this.FSRShader
                break
            case RENDERING_TYPES.DEFAULT:
                shaderToApply = this.noFxaaShader
                break
            default:
                shaderToApply = this.shader
                break
        }

        shaderToApply.use()
        shaderToApply.bindForUse({
            uSampler: this.frameBuffer.colors[0],

            FXAASpanMax: 8,
            FXAAReduceMin: 1 / 128,
            inverseFilterTextureSize: [1 / this.gpu.drawingBufferWidth, 1 / this.gpu.drawingBufferHeight, 0],
            FXAAReduceMul: 1 / 8
        })
        this.frameBuffer.draw()
    }
}