import System from "../basic/System";
import ShadowMap from "../../renderer/elements/ShadowMap";
import ShadowMapShader from "../../renderer/shaders/shadowmap/ShadowMapShader";

export default class ShadowMapSystem extends System {

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.shadowMaps = [
            new ShadowMap(2048, gpu),
            new ShadowMap(2048, gpu),
            new ShadowMap(2048, gpu),
            new ShadowMap(2048, gpu)
        ]
        this.shader = new ShadowMapShader(gpu)
    }

    execute(entities, params, systems, filteredEntities) {
        super.execute()
        const {
            meshes
        } = params

        const directionalLights = this._find(entities, e => filteredEntities.directionalLights[e.id] !== undefined)
        const filteredMeshes = this._find(entities, e => filteredEntities.meshes[e.id] !== undefined && e.components.MeshComponent.active && e.components.TransformComponent.active)

        this.shader.use()

        for(let light = 0; light < directionalLights.length; light++){
            const currentShadowMap = this.shadowMaps[light]
            currentShadowMap.gpu.clearDepth(1);
            currentShadowMap.startMapping()

            const l = directionalLights[light].components.DirectionalLightComponent
            for (let m = 0; m < filteredMeshes.length; m++) {
                const meshIndex = filteredEntities.meshSources[filteredMeshes[m].components.MeshComponent.meshID]
                const mesh = meshes[meshIndex]
                if (mesh !== undefined) {
                    const t = filteredMeshes[m].components.TransformComponent
                    this._drawMesh(mesh, l.lightView, l.lightProjection, t.transformationMatrix, currentShadowMap)
                }
            }
            currentShadowMap.stopMapping()
        }
    }

    _drawMesh(mesh, viewMatrix, projectionMatrix, transformationMatrix, currentShadowMap) {

        this.gpu.bindVertexArray(mesh.VAO)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)
        mesh.vertexVBO.enable()
        this.gpu.uniformMatrix4fv(this.shader.transformMatrixULocation, false, transformationMatrix)
        this.gpu.uniformMatrix4fv(this.shader.viewMatrixULocation, false, viewMatrix)
        this.gpu.uniformMatrix4fv(this.shader.projectionMatrixULocation, false, projectionMatrix)
        this.gpu.drawElements(this.gpu.TRIANGLES, mesh.verticesQuantity, currentShadowMap.gpu.UNSIGNED_INT, 0)

        // EXIT
        this.gpu.bindVertexArray(null)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, null)
        mesh.vertexVBO.disable()
    }
}