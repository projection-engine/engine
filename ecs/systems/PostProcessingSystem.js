import System from "../basic/System";
import PostProcessingShader from "../../renderer/shaders/classes/PostProcessingShader";
import PostProcessing from "../../renderer/elements/PostProcessing";
import DeferredShader from "../../renderer/shaders/classes/DeferredShader";
import DeferredSystem from "./DeferredSystem";
import SkyBoxShader from "../../renderer/shaders/classes/SkyBoxShader";
import GridShader from "../../renderer/shaders/classes/GridShader";
import ShadowMapSystem from "./ShadowMapSystem";
import Texture from "../../renderer/elements/Texture";
import BillboardRenderer from "../../renderer/elements/BillboardRenderer";
import MeshShader from "../../renderer/shaders/classes/MeshShader";

import FlatDeferredShader from "../../renderer/shaders/classes/FlatDeferredShader";
import pointLightIcon from '../../../../static/icons/point_light.png'
import directionalLightIcon from '../../../../static/icons/directional_light.png'
import spotLightIcon from '../../../../static/icons/spot_light.png'
import cubeMapIcon from '../../../../static/icons/cubemap.png'
import {SHADING_MODELS} from "../../../../pages/project/hook/useSettings";
import {copyTexture} from "../../utils/utils";
import ScreenSpace from "../../renderer/elements/ScreenSpace";
import OrthographicCamera from "../../camera/ortho/OrthographicCamera";

export default class PostProcessingSystem extends System {

    constructor(gpu, resolutionMultiplier) {
        super([]);
        this.gpu = gpu

        // this.shadowMapDebugShader = new ShadowMapDebugShader(gpu)
        // this.quad = new Quad(gpu)

        this.screenSpace = new ScreenSpace(gpu, resolutionMultiplier)
        this.billboardRenderer = new BillboardRenderer(gpu)
        this.pointLightTexture = new Texture(pointLightIcon, false, gpu)
        this.directionalLightTexture = new Texture(directionalLightIcon, false, gpu)

        this.spotLightTexture = new Texture(spotLightIcon, false, gpu)
        this.cubemapTexture = new Texture(cubeMapIcon, false, gpu)


        this.postProcessing = new PostProcessing(gpu, resolutionMultiplier)


        this.shader = new PostProcessingShader(gpu)
        this.noFxaaShader = new PostProcessingShader(gpu, true)
        this.skyboxShader = new SkyBoxShader(gpu)
        this.gridShader = new GridShader(gpu)


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

    execute(entities, params, systems, filteredEntities) {
        super.execute()
        const {
            meshes,
            selectedElement,
            camera,
            BRDF,
            shadingModel,
            fxaa,
            iconsVisibility,
            gridVisibility
        } = params

        const grid = this._find(entities, e => e.components.GridComponent?.active)[0]

        const deferredSystem = systems.find(s => s instanceof DeferredSystem)
        const shadowMapSystem = systems.find(s => s instanceof ShadowMapSystem)

        const pointLights = this._find(entities, e => filteredEntities.pointLights[e.id] !== undefined)
        const directionalLights = this._find(entities, e => filteredEntities.directionalLights[e.id] !== undefined)
        const spotLights = this._find(entities, e => filteredEntities.spotLights[e.id] !== undefined)
        const cubeMaps = this._find(entities, e => filteredEntities.cubeMaps[e.id] !== undefined)
        const skyboxElement = this._find(entities, e => e.components.SkyboxComponent && e.components.SkyboxComponent.active)[0]


        copyTexture(this.screenSpace.frameBufferObject, this.postProcessing.frameBufferObject, this.gpu, this.gpu.COLOR_BUFFER_BIT)

        this.postProcessing.startMapping()

        if (skyboxElement && !(camera instanceof OrthographicCamera)) {
            const ntVm = camera.getNotTranslatedViewMatrix()

            this.gpu.depthMask(false)
            this.skyboxShader.use()

            skyboxElement.components.SkyboxComponent.draw(
                this.skyboxShader,
                camera.projectionMatrix,
                ntVm
            )
            this.gpu.depthMask(true)
        }
        this._miscRenderPass(skyboxElement, grid, camera, [...pointLights, ...directionalLights, ...spotLights, ...cubeMaps],
            iconsVisibility,
            gridVisibility)

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
            BRDF,
            closestCubeMap: skyboxElement?.components.SkyboxComponent.cubeMapPrefiltered,

            previousFrame: this.screenSpace.frameBufferTexture
        })

        deferredSystem.gBuffer.draw(deferred)

        copyTexture(this.postProcessing.frameBufferObject, deferredSystem.gBuffer.gBuffer, this.gpu, this.gpu.DEPTH_BUFFER_BIT)


        this.gpu.disable(this.gpu.DEPTH_TEST)

        if (selectedElement) {
            const el = entities[filteredEntities.meshes[selectedElement]]
            if (el)
                this._drawSelected(meshes[filteredEntities.meshSources[el.components.MeshComponent.meshID]], camera, el)
        }
        this.gpu.enable(this.gpu.DEPTH_TEST)

        this.postProcessing.stopMapping()
        let shaderToApply = this.shader

        if (!fxaa)
            shaderToApply = this.noFxaaShader

        shaderToApply.use()
        this.postProcessing.draw(shaderToApply)

        // this.shadowMapDebugShader.use()
        //
        // bindTexture(
        //     0,
        //     shadowMapSystem.shadowMapAtlas.frameBufferTexture,
        //     this.shadowMapDebugShader.shadowMapULocation,
        //     this.gpu)
        //
        //
        // this.quad.draw(this.shadowMapDebugShader.positionLocation)

    }

    _map(billboards) {
        let point = [], directional = [], spot = [], cubemaps = []


        for (let i = 0; i < billboards.length; i++) {
            if (billboards[i].components.PointLightComponent)
                point.push(Array.from(billboards[i].components.PointLightComponent.transformationMatrix))
            else if (billboards[i].components.DirectionalLightComponent)
                directional.push(Array.from(billboards[i].components.DirectionalLightComponent?.transformationMatrix))
            else if (billboards[i].components.SpotLightComponent)
                spot.push(Array.from(billboards[i].components.SpotLightComponent.transformationMatrix))
            else if (billboards[i].components.CubeMapComponent)
                cubemaps.push(Array.from(billboards[i].components.CubeMapComponent.transformationMatrix))
        }

        return {
            pointLights: point,
            directionalLights: directional,
            spotLights: spot,
            cubemaps: cubemaps
        }
    }

    _miscRenderPass(skybox, grid, camera, billboards,
                    iconsVisibility,
                    gridVisibility) {
        //GRID
        if (grid && gridVisibility) {
            if (camera instanceof OrthographicCamera)
                this.gpu.disable(this.gpu.DEPTH_TEST)
            this.gridShader.use()

            this.gpu.enableVertexAttribArray(this.gridShader.positionLocation)
            this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, grid.components.GridComponent.vertexBuffer)
            this.gpu.vertexAttribPointer(this.gridShader.positionLocation, 3, this.gpu.FLOAT, false, 0, 0)

            this.gpu.uniform1i(this.gridShader.typeULocation, camera instanceof OrthographicCamera ? 1 + camera.direction : 0)
            this.gpu.uniformMatrix4fv(this.gridShader.viewMatrixULocation, false, camera instanceof OrthographicCamera ? camera.viewMatrixGrid : camera.viewMatrix)
            this.gpu.uniformMatrix4fv(this.gridShader.projectionMatrixULocation, false, camera.projectionMatrix)

            this.gpu.drawArrays(this.gpu.TRIANGLES, 0, grid.components.GridComponent.length)
            if (camera instanceof OrthographicCamera)
                this.gpu.enable(this.gpu.DEPTH_TEST)
        }

        if (billboards.length > 0 && iconsVisibility) {
            const mapped = this._map(billboards)

            this.billboardRenderer.draw(mapped.pointLights, this.pointLightTexture.texture, camera)
            this.billboardRenderer.draw(mapped.directionalLights, this.directionalLightTexture.texture, camera)
            this.billboardRenderer.draw(mapped.spotLights, this.spotLightTexture.texture, camera)
            this.billboardRenderer.draw(mapped.cubemaps, this.cubemapTexture.texture, camera)
        }
    }

    _drawSelected(mesh, camera, element) {
        this.meshShader.use()
        // shader,
        //     gpu,
        //     mesh,
        //     camPosition,
        //     viewMatrix,
        //     projectionMatrix,
        //     transformationMatrix,
        //     material,
        //     normalMatrix
        DeferredSystem.drawMesh(
            this.meshShader,
            this.gpu,
            mesh,
            camera.position,
            camera.viewMatrix,
            camera.projectionMatrix,
            element.components.TransformComponent.transformationMatrix,
            {},
            element.components.MeshComponent.normalMatrix)
    }
}