import System from "../basic/System";
import ShadowMap from "../../renderer/elements/ShadowMap";
import ShadowMapShader from "../../renderer/shaders/shadowmap/ShadowMapShader";
import {SHADING_MODELS} from "../../../../views/editor/hook/useSettings";

export default class ShadowMapSystem extends System {

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.resolutionPerTexture = 1024
        this.maxResolution = 4092
        this.shadowMapAtlas = new ShadowMap(this.maxResolution, gpu)
        this.shader = new ShadowMapShader(gpu)
    }

    execute(entities, params, systems, filteredEntities) {
        super.execute()
        const {
            meshes,
            shadingModel
        } = params
        if (shadingModel === SHADING_MODELS.DETAIL) {
            const directionalLights = this._find(entities, e => filteredEntities.directionalLights[e.id] !== undefined)
            const spotLights = this._find(entities, e => filteredEntities.spotLights[e.id] !== undefined)
            const filteredMeshes = this._find(entities, e => filteredEntities.meshes[e.id] !== undefined && e.components.MeshComponent.active && e.components.TransformComponent.active)

            this.shader.use()

            let currentColumn = 0, currentRow = 0
            const maxLights = directionalLights.length + spotLights.length

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
                    const currentLight = isSpotLight ? spotLights[face].SpotLightComponent : directionalLights[face].components.DirectionalLightComponent
                    currentLight.atlasFace = [currentColumn, 0]

                    this.gpu.disable(this.gpu.SCISSOR_TEST);
                    for (let m = 0; m < filteredMeshes.length; m++) {
                        const meshIndex = filteredEntities.meshSources[filteredMeshes[m].components.MeshComponent.meshID]
                        const mesh = meshes[meshIndex]
                        if (mesh !== undefined) {
                            const t = filteredMeshes[m].components.TransformComponent
                            this._drawMesh(mesh, currentLight.lightView, currentLight.lightProjection, t.transformationMatrix)
                        }
                    }


                }
                if (currentColumn > this.maxResolution / this.resolutionPerTexture) {
                    currentColumn = 0
                    currentRow += 1
                } else
                    currentColumn += 1
            }

            this.shadowMapAtlas.stopMapping()
        }
    }

    _drawMesh(mesh, viewMatrix, projectionMatrix, transformationMatrix) {

        this.gpu.bindVertexArray(mesh.VAO)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)
        mesh.vertexVBO.enable()
        this.gpu.uniformMatrix4fv(this.shader.transformMatrixULocation, false, transformationMatrix)
        this.gpu.uniformMatrix4fv(this.shader.viewMatrixULocation, false, viewMatrix)
        this.gpu.uniformMatrix4fv(this.shader.projectionMatrixULocation, false, projectionMatrix)
        this.gpu.drawElements(this.gpu.TRIANGLES, mesh.verticesQuantity, this.gpu.UNSIGNED_INT, 0)

        // EXIT
        this.gpu.bindVertexArray(null)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, null)
        mesh.vertexVBO.disable()

    }
}