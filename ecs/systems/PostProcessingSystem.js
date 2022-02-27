import System from "../basic/System";
import PostProcessingShader from "../../shaders/classes/PostProcessingShader";
import PostProcessingFramebuffer from "../../elements/buffer/PostProcessingFramebuffer";
import MeshSystem from "./MeshSystem";
import {bindTexture, copyTexture} from "../../utils/misc/utils";
import ScreenSpaceBuffer from "../../elements/buffer/ScreenSpaceBuffer";
import DeferredSystem from "./subsystems/DeferredSystem";
import GridSystem from "./subsystems/GridSystem";
import BillboardSystem from "./subsystems/BillboardSystem";
import SelectedSystem from "./subsystems/SelectedSystem";
import SkyboxSystem from "./subsystems/SkyboxSystem";
import Quad from "../../utils/workers/Quad";
import ShadowMapDebugShader from "../../shaders/classes/ShadowMapDebugShader";
import ShadowMapSystem from "./ShadowMapSystem";
import GlobalIlluminationSystem from "./subsystems/GlobalIlluminationSystem";

export default class PostProcessingSystem extends System {
    constructor(gpu, resolutionMultiplier) {
        super([]);
        this.gpu = gpu

        this.screenSpace = new ScreenSpaceBuffer(gpu, resolutionMultiplier)
        this.postProcessing = new PostProcessingFramebuffer(gpu, resolutionMultiplier)

        this.shadowMapDebugShader = new ShadowMapDebugShader(gpu)
        this.quad = new Quad(gpu)

        this.shader = new PostProcessingShader(gpu)
        this.noFxaaShader = new PostProcessingShader(gpu, true)


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
        const  {
            pointLights,
            spotLights,
            terrains,
            meshes,
            skybox,
            directionalLights,
            materials,
            meshSources,
            cubeMaps
        } = data
        const {
            selected,
            camera,
            fxaa,
            iconsVisibility,
            gridVisibility,
            shadingModel
        } = options
        this.gpu.enable(this.gpu.BLEND);
        const meshSystem = systems.find(s => s instanceof MeshSystem)

        // const shadowMapSystem = systems.find(s => s instanceof ShadowMapSystem)
        // SSR
        copyTexture(this.screenSpace.frameBufferObject, this.postProcessing.frameBufferObject, this.gpu, this.gpu.COLOR_BUFFER_BIT)

        this.postProcessing.startMapping()

        this.skyboxSystem.execute(skybox, camera)
        this.gridSystem.execute(gridVisibility, camera)
        this.billboardSystem.execute(pointLights, directionalLights, spotLights, cubeMaps, camera, iconsVisibility)

        this.deferredSystem.execute(skybox, pointLights, directionalLights, spotLights, cubeMaps, camera, shadingModel, systems)

        copyTexture(this.postProcessing.frameBufferObject, meshSystem.gBuffer.gBuffer, this.gpu, this.gpu.DEPTH_BUFFER_BIT)


        this.gpu.disable(this.gpu.DEPTH_TEST);
        this.gpu.blendFunc(this.gpu.ONE, this.gpu.ONE);
        this.GISystem.execute(systems, directionalLights)
        this.gpu.blendFunc(this.gpu.SRC_ALPHA, this.gpu.ONE_MINUS_SRC_ALPHA);


        this.selectedSystem.execute(meshes, meshSources, selected, camera)
        this.postProcessing.stopMapping()
        //
        let shaderToApply = this.shader

        if (!fxaa)
            shaderToApply = this.noFxaaShader

        shaderToApply.use()
        this.postProcessing.draw(shaderToApply)

        // this.shadowMapDebugShader.use()
        //
        // bindTexture(
        //     0,
        //     shadowMapSystem.shadowMapAtlas.rsmFluxTexture,
        //     this.shadowMapDebugShader.shadowMapULocation,
        //     this.gpu)
        //
        //
        // this.quad.draw(this.shadowMapDebugShader.positionLocation)

    }
}