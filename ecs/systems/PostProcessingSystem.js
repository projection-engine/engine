import System from "../basic/System";
import PostProcessingShader from "../../renderer/shaders/postprocessing/PostProcessingShader";
import PostProcessing from "../../renderer/elements/PostProcessing";
import DeferredShader from "../../renderer/shaders/deferred/DeferredShader";
import DeferredSystem from "./DeferredSystem";
import SkyBoxShader from "../../renderer/shaders/skybox/SkyBoxShader";
import GridShader from "../../renderer/shaders/grid/GridShader";
import ShadowMapSystem from "./ShadowMapSystem";
import Texture from "../../renderer/elements/Texture";
import BillboardRenderer from "../utils/BillboardRenderer";

export default class PostProcessingSystem extends System {

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.billboardRenderer = new BillboardRenderer(gpu)
        this.pointLightTexture = new Texture('./icons/point_light.png', false, gpu)
        this.directionalLightTexture = new Texture('./icons/directional_light.png', false, gpu)

        this.spotLightTexture = new Texture('./icons/spot_light.png', false, gpu)
        this.cubemapTexture = new Texture('./icons/cubemap.png', false, gpu)


        this.postProcessing = new PostProcessing(gpu)
        this.shader = new PostProcessingShader(gpu)
        this.skyboxShader = new SkyBoxShader(gpu)
        this.gridShader = new GridShader(gpu)
        this.deferredShader = new DeferredShader(gpu)


    }

    execute(entities, params, systems, filteredEntities) {
        super.execute()
        const {
            meshes,
            setSelectedElement,
            currentCoords,
            clicked,
            camera,
            shadowMapResolution = 2048
        } = params

        const grid = this._find(entities, e => e.components.GridComponent?.active)[0]

        const deferredSystem = systems.find(s => s instanceof DeferredSystem)
        const shadowMapSystem = systems.find(s => s instanceof ShadowMapSystem)

        const pointLights = this._find(entities, e => filteredEntities.pointLights[e.id] !== undefined)
        const directionalLights = this._find(entities, e => filteredEntities.directionalLights[e.id] !== undefined)
        const spotLights = this._find(entities, e => filteredEntities.spotLights[e.id] !== undefined)
        const cubeMaps =  this._find(entities, e => filteredEntities.cubeMaps[e.id] !== undefined)
        const skyboxElement = this._find(entities, e => e.components.SkyboxComponent && e.components.SkyboxComponent.active)[0]

        this.postProcessing.startMapping()

        if (skyboxElement) {
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

        this.deferredShader.use()
        this.deferredShader.bindUniforms({
            irradianceMap: skyboxElement?.components.SkyboxComponent.irradianceMap,
            skyboxTexture: skyboxElement?.components.SkyboxComponent.cubeMap,
            lights: pointLights,
            shadowMapResolution: shadowMapResolution,

            // DIRECTIONAL LIGHTS
            directionalLights: directionalLights.map(d => d.components.DirectionalLightComponent),
            shadowMaps: shadowMapSystem.shadowMaps.map(s => s.frameBufferTexture),

            gNormalTexture: deferredSystem.gBuffer.gNormalTexture,
            gPositionTexture: deferredSystem.gBuffer.gPositionTexture,
            gAlbedo: deferredSystem.gBuffer.gAlbedo,
            gBehaviorTexture: deferredSystem.gBuffer.gBehaviorTexture,
            gDepthTexture: deferredSystem.gBuffer.gDepthTexture,
            cameraVec: camera.position
        })

        deferredSystem.gBuffer.draw(this.deferredShader)

        this.gpu.bindFramebuffer(this.gpu.READ_FRAMEBUFFER, deferredSystem.gBuffer.gBuffer)
        this.gpu.bindFramebuffer(this.gpu.DRAW_FRAMEBUFFER, this.postProcessing.frameBufferObject)
        this.gpu.blitFramebuffer(
            0, 0,
            deferredSystem.gBuffer.width, deferredSystem.gBuffer.height,
            0, 0,
            this.postProcessing.width, this.postProcessing.height,
            this.gpu.DEPTH_BUFFER_BIT, this.gpu.NEAREST)
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.postProcessing.frameBufferObject)

        this._miscRenderPass(skyboxElement, grid, camera, [...pointLights, ...directionalLights, ...spotLights, ...cubeMaps])


        this.postProcessing.stopMapping()
        this.shader.use()
        this.postProcessing.draw(this.shader)
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

    _miscRenderPass(skybox, grid, camera, billboards) {
        //GRID
        if (grid) {
            this.gridShader.use()

            this.gpu.enableVertexAttribArray(this.gridShader.positionLocation)
            this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, grid.components.GridComponent.vertexBuffer)
            this.gpu.vertexAttribPointer(this.gridShader.positionLocation, 3, this.gpu.FLOAT, false, 0, 0)

            this.gpu.uniform4fv(this.gridShader.colorULocation, grid.components.GridComponent.color)

            this.gpu.uniformMatrix4fv(this.gridShader.transformationMatrixULocation, false, grid.components.GridComponent.scalingMatrix)
            this.gpu.uniformMatrix4fv(this.gridShader.viewMatrixULocation, false, camera.viewMatrix)
            this.gpu.uniformMatrix4fv(this.gridShader.projectionMatrixULocation, false, camera.projectionMatrix)

            this.gpu.drawArrays(this.gpu.LINES, 0, grid.components.GridComponent.length)
        }

        if (billboards.length > 0) {
            const mapped = this._map(billboards)

            this.billboardRenderer.draw(mapped.pointLights, this.pointLightTexture.texture, camera)
            this.billboardRenderer.draw(mapped.directionalLights, this.directionalLightTexture.texture, camera)
            this.billboardRenderer.draw(mapped.spotLights, this.spotLightTexture.texture, camera)
            this.billboardRenderer.draw(mapped.cubemaps, this.cubemapTexture.texture, camera)
        }

    }
}