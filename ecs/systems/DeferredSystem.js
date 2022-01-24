import System from "../basic/System";
import TransformComponent from "../components/TransformComponent";

import GBuffer from "../../renderer/elements/GBuffer";
import MaterialComponent from "../components/MaterialComponent";
import MeshShader from "../../renderer/shaders/mesh/MeshShader";

export default class DeferredSystem extends System {

    constructor(gpu) {
        super(['TransformComponent']);
        this.fallbackMaterial = new MaterialComponent(gpu)
        this.gBuffer = new GBuffer(gpu)
        this.shader = new MeshShader(gpu)
    }

    execute(entities, params, systems, filteredEntities) {
        super.execute()
        const {
            meshes,
            camera,
            selectedElement,
        } = params
        const filteredMeshes = this._find(entities, e => filteredEntities.meshes[e.id] !== undefined)
        const filtered = this._hasComponent(filteredMeshes)


        this.shader.use()
        this.gBuffer.gpu.clearDepth(1);
        this.gBuffer.startMapping()

        for (let m = 0; m < filtered.length; m++) {
            const mesh = this._find(meshes, e => e.id === filtered[m].components.MeshComponent.meshID && filtered[m].components.MeshComponent.active)[0]
            if (mesh !== undefined) {
                const t = filtered[m].components.TransformComponent
                const mat = filtered[m].components.MaterialComponent
                this._drawMesh(
                    mesh,
                    camera.position,
                    camera.viewMatrix,
                    camera.projectionMatrix,
                    t.transformationMatrix,
                    mat ? mat : this.fallbackMaterial,
                    filtered[m].components.MeshComponent.normalMatrix,
                    selectedElement === filtered[m].id
                )
            }
        }
        this.gBuffer.stopMapping()

    }

    _drawMesh(mesh, camPosition, viewMatrix, projectionMatrix, transformationMatrix, material, normalMatrix, selected) {

        this.gBuffer.gpu.bindVertexArray(mesh.VAO)
        this.gBuffer.gpu.bindBuffer(this.gBuffer.gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)

        mesh.vertexVBO.enable()
        mesh.normalVBO.enable()
        mesh.uvVBO.enable()
        mesh.tangentVBO.enable()

        this.shader.bindUniforms({
            material: material,
            cameraVec: camPosition,
            normalMatrix: normalMatrix,
            selected
        })

        this.gBuffer.gpu.uniformMatrix4fv(this.shader.transformMatrixULocation, false, transformationMatrix)
        this.gBuffer.gpu.uniformMatrix4fv(this.shader.viewMatrixULocation, false, viewMatrix)
        this.gBuffer.gpu.uniformMatrix4fv(this.shader.projectionMatrixULocation, false, projectionMatrix)
        this.gBuffer.gpu.drawElements(this.gBuffer.gpu.TRIANGLES, mesh.verticesQuantity, this.gBuffer.gpu.UNSIGNED_INT, 0)


        this.gBuffer.gpu.bindVertexArray(null)
        this.gBuffer.gpu.bindBuffer(this.gBuffer.gpu.ELEMENT_ARRAY_BUFFER, null)
        mesh.vertexVBO.disable()
        mesh.uvVBO.disable()
        mesh.normalVBO.disable()
        mesh.tangentVBO.disable()

    }
}