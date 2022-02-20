import System from "../../basic/System";
import MeshShader from "../../../renderer/shaders/classes/MeshShader";
import {SHADING_MODELS} from "../../../../../pages/project/hook/useSettings";
import DeferredShader from "../../../renderer/shaders/classes/DeferredShader";
import FlatDeferredShader from "../../../renderer/shaders/classes/FlatDeferredShader";
import ShadowMapSystem from "../ShadowMapSystem";

export default class DeferredSystem extends System {

    constructor(gpu) {
        super([]);

        this.gpu = gpu
        this.deferredShader = new DeferredShader(gpu)
        this.flatDeferredShader = new FlatDeferredShader(gpu)
        this.meshShader = new MeshShader(gpu, true)
    }
    _getDeferredShader(shadingModel) {
        switch (shadingModel) {
            case SHADING_MODELS.FLAT:
                return this.flatDeferredShader
            case SHADING_MODELS.DETAIL:
                return this.deferredShader
            case SHADING_MODELS.WIREFRAME:
                return this.flatDeferredShader
            default:
                return this.deferredShader
        }
    }

    execute(entities, params, systems, filteredEntities, deferredSystem) {
        super.execute()
        const {
            camera,
            BRDF,
            shadingModel,
        } = params

        const shadowMapSystem = systems.find(s => s instanceof ShadowMapSystem)
        const deferred = this._getDeferredShader(shadingModel)
        const skyboxElement = this._find(entities, e => e.components.SkyboxComponent && e.components.SkyboxComponent.active)[0]

        const pointLights = this._find(entities, e => filteredEntities.pointLights[e.id] !== undefined)
        const directionalLights = this._find(entities, e => filteredEntities.directionalLights[e.id] !== undefined)
        const spotLights = this._find(entities, e => filteredEntities.spotLights[e.id] !== undefined)
        const cubeMaps = this._find(entities, e => filteredEntities.cubeMaps[e.id] !== undefined)

        deferred.use()
        deferred.bindUniforms({
            irradianceMap: skyboxElement?.components.SkyboxComponent.irradianceMap,
            lights: pointLights,
            directionalLights: directionalLights.map(d => d.components.DirectionalLightComponent),

            shadowMap: shadowMapSystem?.shadowMapAtlas.frameBufferTexture,
            shadowMapResolution: shadowMapSystem?.maxResolution,
            shadowMapsQuantity: shadowMapSystem ? (shadowMapSystem.maxResolution / shadowMapSystem.resolutionPerTexture) : undefined,
            gNormalTexture: deferredSystem.gBuffer.gNormalTexture,
            gPositionTexture: deferredSystem.gBuffer.gPositionTexture,
            gAlbedo: deferredSystem.gBuffer.gAlbedo,
            gBehaviorTexture: deferredSystem.gBuffer.gBehaviorTexture,
            gDepthTexture: deferredSystem.gBuffer.gDepthTexture,
            cameraVec: camera.position,
            BRDF,
            closestCubeMap: skyboxElement?.components.SkyboxComponent.cubeMapPrefiltered,

         //   previousFrame: this.screenSpace.frameBufferTexture
        })

        deferredSystem.gBuffer.draw(deferred)

    }

}