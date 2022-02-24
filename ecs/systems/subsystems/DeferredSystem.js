import System from "../../basic/System";
import MeshShader from "../../../renderer/shaders/classes/MeshShader";
import {SHADING_MODELS} from "../../../../../pages/project/hook/useSettings";
import DeferredShader from "../../../renderer/shaders/classes/DeferredShader";
import FlatDeferredShader from "../../../renderer/shaders/classes/FlatDeferredShader";
import ShadowMapSystem from "../ShadowMapSystem";
import brdfImg from "../../../../../static/brdf_lut.jpg";
import {createTexture} from "../../../utils/utils";
import MeshSystem from "../MeshSystem";

export default class DeferredSystem extends System {

    constructor(gpu) {
        super([]);

        this.gpu = gpu
        this.deferredShader = new DeferredShader(gpu)
        this.flatDeferredShader = new FlatDeferredShader(gpu)
        this.meshShader = new MeshShader(gpu, true)

        const brdf = new Image()
        brdf.src = brdfImg

        brdf.onload = () => {
            this.BRDF = createTexture(
                gpu,
                512,
                512,
                gpu.RGBA32F,
                0,
                gpu.RGBA,
                gpu.FLOAT,
                brdf,
                gpu.LINEAR,
                gpu.LINEAR,
                gpu.CLAMP_TO_EDGE,
                gpu.CLAMP_TO_EDGE
            )
        }
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

    execute(skyboxElement, pointLights, directionalLights, spotLights, cubeMaps, camera, shadingModel, systems) {
        super.execute()
        const shadowMapSystem = systems.find(s => s instanceof ShadowMapSystem)
        const deferredSystem = systems.find(s => s instanceof MeshSystem)
        const deferred = this._getDeferredShader(shadingModel)


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
            BRDF: this.BRDF,
            closestCubeMap: skyboxElement?.components.SkyboxComponent.cubeMapPrefiltered,

         //   previousFrame: this.screenSpace.frameBufferTexture
        })

        deferredSystem.gBuffer.draw(deferred)

    }

}