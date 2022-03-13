import System from "../basic/System";
import DeferredSystem from "./subsystems/DeferredSystem";
import GridSystem from "./subsystems/GridSystem";
import BillboardSystem from "./subsystems/BillboardSystem";
import SelectedSystem from "./subsystems/SelectedSystem";
import SkyboxSystem from "./subsystems/SkyboxSystem";
import Quad from "../../utils/workers/Quad";
import GlobalIlluminationSystem from "./subsystems/gi/GlobalIlluminationSystem";
import SYSTEMS from "../../utils/misc/SYSTEMS";
import Shader from "../../utils/workers/Shader";
import * as debug from '../../shaders/shadows/shadow.glsl'

import * as shaderCode from '../../shaders/misc/postProcessing.glsl'
import FramebufferInstance from "../../instances/FramebufferInstance";

export default class PostProcessingSystem extends System {
    constructor(gpu, resolutionMultiplier) {
        super([]);
        this.gpu = gpu
        this.frameBuffer = new FramebufferInstance(gpu, window.screen.width * resolutionMultiplier, window.screen.height * resolutionMultiplier)
        this.frameBuffer
            .texture()

        this.shadowMapDebugShader = new Shader(debug.debugVertex, debug.debugFragment, gpu)
        this.quad = new Quad(gpu)

        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.noFxaaShader = new Shader(shaderCode.vertex, shaderCode.noFxaaFragment, gpu)


        this.GISystem = new GlobalIlluminationSystem(gpu)
        this.skyboxSystem = new SkyboxSystem(gpu)
        this.deferredSystem = new DeferredSystem(gpu)
        this.gridSystem = new GridSystem(gpu)
        this.billboardSystem = new BillboardSystem(gpu)
        this.billboardSystem.initializeTextures().catch()
        this.selectedSystem = new SelectedSystem(gpu)
    }

    execute(options, systems, data) {
        super.execute()
        const {
            pointLights,
            spotLights,
            terrains,
            meshes,
            skybox,
            directionalLights,
            materials,
            meshSources,
            cubeMaps,
            skylight
        } = data
        const {
            selected,
            camera,
            fxaa,
            iconsVisibility,
            gridVisibility,
            shadingModel,
            noRSM,
            gamma,
            exposure
        } = options

        if (!noRSM && systems[SYSTEMS.SHADOWS].needsGIUpdate && skylight)
            this.GISystem.execute(systems, skylight)






        this.frameBuffer.startMapping()
        this.skyboxSystem.execute(skybox, camera)
        this.gridSystem.execute(gridVisibility, camera)

        let giFBO, giGridSize
        if (!noRSM && skylight) {
            giGridSize = this.GISystem.size
            giFBO = this.GISystem.accumulatedBuffer
        }

        this.deferredSystem.execute(skybox, pointLights, directionalLights, spotLights, cubeMaps, camera, shadingModel, systems, giFBO, giGridSize, skylight)

        this.gpu.enable(this.gpu.BLEND)
        this.gpu.blendFunc(this.gpu.SRC_ALPHA, this.gpu.ONE_MINUS_SRC_ALPHA)
        this.gpu.disable(this.gpu.DEPTH_TEST)

        this.gpu.disable(this.gpu.DEPTH_TEST)
        this.selectedSystem.execute(meshes, meshSources, selected, camera)
        this.billboardSystem.execute(pointLights, directionalLights, spotLights, cubeMaps, camera, iconsVisibility, skylight)
        this.gpu.enable(this.gpu.DEPTH_TEST)

        this.frameBuffer.stopMapping()

        let shaderToApply = this.shader

        if (!fxaa)
            shaderToApply = this.noFxaaShader

        shaderToApply.use()
        shaderToApply.bindForUse({
            uSampler: this.frameBuffer.colors[0],
            gamma: gamma ? gamma : 1,
            exposure: exposure ? exposure : 2,
            FXAASpanMax: 8,
            FXAAReduceMin: 1 / 128,
            inverseFilterTextureSize: [1 / this.gpu.drawingBufferWidth, 1 / this.gpu.drawingBufferHeight, 0],
            FXAAReduceMul: 1 / 8
        })
        this.frameBuffer.draw()



        // this.gpu.viewport(0, 0, this.frameBuffer.width, this.frameBuffer.height);
        // this.shadowMapDebugShader.use()
        // this.shadowMapDebugShader.bindForUse({
        //     uSampler:systems[SYSTEMS.SHADOWS].rsmFramebuffer.colors[1]
        // })
        // this.quad.draw()

    }
}