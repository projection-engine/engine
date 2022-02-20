import System from "../basic/System";
import PostProcessingShader from "../../renderer/shaders/classes/PostProcessingShader";
import PostProcessing from "../../renderer/elements/PostProcessing";
import MeshSystem from "./MeshSystem";
import {copyTexture} from "../../utils/utils";
import ScreenSpace from "../../renderer/elements/ScreenSpace";
import DeferredSystem from "./subsystems/DeferredSystem";
import GridSystem from "./subsystems/GridSystem";
import BillboardSystem from "./subsystems/BillboardSystem";
import SelectedSystem from "./subsystems/SelectedSystem";
import SkyboxSystem from "./subsystems/SkyboxSystem";

export default class PostProcessingSystem extends System {
    constructor(gpu, resolutionMultiplier) {
        super([]);
        this.gpu = gpu

        this.screenSpace = new ScreenSpace(gpu, resolutionMultiplier)
        this.postProcessing = new PostProcessing(gpu, resolutionMultiplier)


        this.shader = new PostProcessingShader(gpu)
        this.noFxaaShader = new PostProcessingShader(gpu, true)


        this.skyboxSystem = new SkyboxSystem(gpu)
        this.deferredSystem = new DeferredSystem(gpu)
        this.gridSystem = new GridSystem(gpu)
        this.billboardSystem = new BillboardSystem(gpu)
        this.billboardSystem.initializeTextures().catch()
        this.selectedSystem = new SelectedSystem(gpu)
    }

    execute(entities, params, systems, filteredEntities) {
        super.execute()
        const {
            camera,
            fxaa
        } = params
        const meshSystem = systems.find(s => s instanceof MeshSystem)
        const skyboxElement = this._find(entities, e => e.components.SkyboxComponent && e.components.SkyboxComponent.active)[0]

        // SSR
        copyTexture(this.screenSpace.frameBufferObject, this.postProcessing.frameBufferObject, this.gpu, this.gpu.COLOR_BUFFER_BIT)

        this.postProcessing.startMapping()

        this.skyboxSystem.execute(entities, params)
        this.gridSystem.execute(undefined, params)
        this.billboardSystem.execute(entities, params, undefined, filteredEntities)

        this.deferredSystem.execute(entities, params, systems, filteredEntities, meshSystem)
        copyTexture(this.postProcessing.frameBufferObject, meshSystem.gBuffer.gBuffer, this.gpu, this.gpu.DEPTH_BUFFER_BIT)

        this.selectedSystem.execute(entities, params, filteredEntities)
        this.postProcessing.stopMapping()

        let shaderToApply = this.shader

        if (!fxaa)
            shaderToApply = this.noFxaaShader

        shaderToApply.use()

        this.postProcessing.draw(shaderToApply)
    }
}