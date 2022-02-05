import System from "../basic/System";
import TransformComponent from "../components/TransformComponent";

import GBuffer from "../../renderer/elements/GBuffer";
import MeshShader from "../../renderer/shaders/mesh/MeshShader";
import MaterialInstance from "../../renderer/elements/MaterialInstance";

export default class DeferredSystem extends System {

    constructor(gpu, resolutionMultiplier) {
        super(['TransformComponent']);
        this.fallbackMaterial = new MaterialInstance(gpu)
        this.gBuffer = new GBuffer(gpu, resolutionMultiplier)
        this.shader = new MeshShader(gpu)
    }

    execute(entities, params, systems, filteredEntities) {
        super.execute()
        const {
            meshes,
            camera,
            selectedElement,
            materials
        } = params


        const filteredMeshes = this._find(entities, e => filteredEntities.meshes[e.id] !== undefined)
        const filtered = this._hasComponent(filteredMeshes)


        this.shader.use()
        this.gBuffer.gpu.clearDepth(1);
        this.gBuffer.startMapping()

        for (let m = 0; m < filtered.length; m++) {
            const current = filtered[m]
            const meshIndex = filteredEntities.meshSources[current.components.MeshComponent.meshID]
            const mesh = meshes[meshIndex]

            if (mesh !== undefined && selectedElement !== current.id) {
                const t = current.components.TransformComponent
                const mat = current.components.MaterialComponent?.materialID ? materials[filteredEntities.materials[current.components.MaterialComponent.materialID]] : undefined

                DeferredSystem.drawMesh(
                    this.shader,
                    this.gBuffer.gpu,
                    mesh,
                    camera.position,
                    camera.viewMatrix,
                    camera.projectionMatrix,
                    t.transformationMatrix,
                    mat ? mat : this.fallbackMaterial,
                    current.components.MeshComponent.normalMatrix
                )
            }
        }
        this.gBuffer.stopMapping()

    }

    static drawMesh(
        shader,
        gpu,
        mesh,
        camPosition,
        viewMatrix,
        projectionMatrix,
        transformationMatrix,
        material,
        normalMatrix) {

        gpu.bindVertexArray(mesh.VAO)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)

        mesh.vertexVBO.enable()
        mesh.normalVBO.enable()
        mesh.uvVBO.enable()
        mesh.tangentVBO.enable()

        shader.bindUniforms({
            material: material,
            cameraVec: camPosition,
            normalMatrix: normalMatrix
        })

        gpu.uniformMatrix4fv(shader.transformMatrixULocation, false, transformationMatrix)
        gpu.uniformMatrix4fv(shader.viewMatrixULocation, false, viewMatrix)
        gpu.uniformMatrix4fv(shader.projectionMatrixULocation, false, projectionMatrix)

        gpu.drawElements(gpu.TRIANGLES, mesh.verticesQuantity, gpu.UNSIGNED_INT, 0)


        gpu.bindVertexArray(null)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, null)
        mesh.vertexVBO.disable()
        mesh.uvVBO.disable()
        mesh.normalVBO.disable()
        mesh.tangentVBO.disable()

    }
}