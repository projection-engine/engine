import System from "../basic/System";
import ShadowMapFramebuffer from "../../elements/buffer/shadows/ShadowMapFramebuffer";
import ShadowMapShader from "../../shaders/classes/shadows/ShadowMapShader";
import {SHADING_MODELS} from "../../../../pages/project/hook/useSettings";
import {bindTexture} from "../../utils/misc/utils";
import SYSTEMS from "../../utils/misc/SYSTEMS";
import RSMFramebuffer from "../../elements/buffer/gi/RSMFramebuffer";
import RSMShader from "../../shaders/classes/gi/RSMShader";

export default class ShadowMapSystem extends System {
    _needsGIUpdate = true

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.resolutionPerTexture = 1024
        this.maxResolution = 4096
        this.shadowMapAtlas = new ShadowMapFramebuffer(this.maxResolution, gpu)


        this.rsmResolution = 512
        this.rsmFramebuffer = new RSMFramebuffer(this.rsmResolution, gpu)
        this.shader = new ShadowMapShader(gpu)
        this.rsmShader = new RSMShader(gpu)
    }

    set needsGIUpdate(data) {
        this._needsGIUpdate = data
    }

    get needsGIUpdate() {
        return this._needsGIUpdate
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
            shadingModel,
            injectMaterial
        } = options

        let changed = systems[SYSTEMS.TRANSFORMATION].changed
        for (let i = 0; i < directionalLights.length; i++) {
            const current = directionalLights[i].components.DirectionalLightComponent
            changed = changed || current.changed

            current.changed = false
        }

        if (skylight) {
            changed = changed || skylight.changed

            skylight.changed = false
        }

        if (shadingModel === SHADING_MODELS.DETAIL && changed) {
            console.log('UPDATING SHADOWS')
            this.shader.use()
            const meshSystem = systems[SYSTEMS.MESH]
            let currentColumn = 0, currentRow = 0
            const maxLights = directionalLights.length + spotLights.length + (skylight ? 1 : 0)

            this.gpu.clearDepth(1);
            this.shadowMapAtlas.startMapping()
            this.gpu.cullFace(this.gpu.FRONT)
            for (let face = 0; face < (this.maxResolution / this.resolutionPerTexture) ** 2; face++) {
                if (face < maxLights) {
                    this.gpu.viewport(
                        currentColumn * this.resolutionPerTexture,
                        currentRow * this.resolutionPerTexture,
                        this.resolutionPerTexture,
                        this.resolutionPerTexture
                    )

                    this.gpu.scissor(
                        currentColumn * this.resolutionPerTexture,
                        currentRow * this.resolutionPerTexture,
                        this.resolutionPerTexture,
                        this.resolutionPerTexture
                    )
                    this.gpu.enable(this.gpu.SCISSOR_TEST);
                    this.gpu.clear(this.gpu.DEPTH_BUFFER_BIT)


                    const isSpotLight = face > directionalLights.length - 1
                    let currentLight = isSpotLight ? spotLights[face]?.SpotLightComponent : directionalLights[face].components.DirectionalLightComponent

                    if(!currentLight)
                        currentLight = skylight
                    currentLight.atlasFace = [currentColumn, 0]

                    this.gpu.disable(this.gpu.SCISSOR_TEST);

                    this._loopMeshes(meshes, injectMaterial, meshSources, meshSystem, currentLight, materials, this.shader)
                }
                if (currentColumn > this.maxResolution / this.resolutionPerTexture) {
                    currentColumn = 0
                    currentRow += 1
                } else
                    currentColumn += 1
            }

            this.shadowMapAtlas.stopMapping()
            if (skylight) {

                this.needsGIUpdate = true
                this.rsmShader.use()
                this.gpu.viewport(0, 0, 512, 512)
                this.rsmFramebuffer.startMapping()
                this._loopMeshes(meshes, injectMaterial, meshSources, meshSystem, skylight, materials, this.rsmShader)
                this.rsmFramebuffer.stopMapping()


            }

        }
    }

    _loopMeshes(meshes, injectMaterial, meshSources, meshSystem, currentLight, materials, shader) {
        for (let m = 0; m < meshes.length; m++) {
            const current = meshes[m]
            const mesh = meshSources[current.components.MeshComponent.meshID]
            if (mesh !== undefined) {
                const currentMaterialID = current.components.MaterialComponent.materialID
                let mat = injectMaterial ? injectMaterial : (materials[currentMaterialID] ? materials[currentMaterialID] : this.fallbackMaterial)
                if(!mat || !mat.ready)
                    mat = meshSystem.fallbackMaterial
                const t = current.components.TransformComponent

                this._drawMesh(mesh, currentLight.lightView, currentLight.lightProjection, t.transformationMatrix, current.components.MeshComponent.normalMatrix, mat.albedo.texture, mat.normal.texture, currentLight.fixedColor, shader)
            }
        }
    }

    _drawMesh(mesh, viewMatrix, projectionMatrix, transformationMatrix, normalMatrix, albedo, normal, lightColor, shader) {

        this.gpu.bindVertexArray(mesh.VAO)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)
        mesh.vertexVBO.enable()


        this.gpu.uniformMatrix4fv(shader.transformMatrixULocation, false, transformationMatrix)
        this.gpu.uniformMatrix4fv(shader.viewMatrixULocation, false, viewMatrix)
        this.gpu.uniformMatrix4fv(shader.projectionMatrixULocation, false, projectionMatrix)

        if (shader === this.rsmShader) {
            mesh.normalVBO.enable()
            mesh.uvVBO.enable()

            this.gpu.uniformMatrix3fv(shader.normalMatrixULocation, false, normalMatrix)
            this.gpu.uniform3fv(shader.lightColorULocation, lightColor)
            bindTexture(0, albedo, shader.albedoULocation, this.gpu)
            bindTexture(1, normal, shader.normalULocation, this.gpu)
        }


        this.gpu.drawElements(this.gpu.TRIANGLES, mesh.verticesQuantity, this.gpu.UNSIGNED_INT, 0)

        // EXIT
        this.gpu.bindVertexArray(null)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, null)
        mesh.vertexVBO.disable()
        mesh.normalVBO.disable()
        mesh.uvVBO.disable()

    }
}