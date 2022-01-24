import System from "../basic/System";
import MousePicker from "../../renderer/elements/MousePicker";
import PickerShader from "../../renderer/shaders/picker/PickerShader";
import PickComponent from "../components/PickComponent";

export default class PickSystem extends System {
    constructor(gpu) {
        super(['PickComponent']);
        this.picker = new MousePicker(gpu)
        this.shader = new PickerShader(gpu)
    }

    execute(entities, params, systems,filteredEntities) {
        super.execute()
        const  {
            meshes,
            setSelectedElement,
            currentCoords,
            clicked,
            camera,
        } = params

        if(clicked && typeof currentCoords === "object"){
            const filteredMeshes = this._find(entities, e => filteredEntities.meshes[e.id] !== undefined)
            const filtered = this._hasComponent(filteredMeshes)

            this.shader.use()
            this.picker.start()
            for (let m = 0; m < filtered.length; m++) {
                const mesh = this._find(meshes, e => e.id === filtered[m].components.MeshComponent.meshID)
                if (mesh !== undefined) {
                    const t = filtered[m].components.TransformComponent
                    this._drawMesh(mesh, camera.viewMatrix,   this.picker.getProjection(currentCoords, camera), t.transformationMatrix)
                }
            }
            let data = new Uint8Array(4);
            this.picker.gpu.readPixels(
                0,
                0,
                1,
                1,
                this.picker.gpu.RGBA,
                this.picker.gpu.UNSIGNED_BYTE,
                data);

            const index = data[0] + data[1] + data[2];
            if (index > 0)
                setSelectedElement(index - 1)
            else
                setSelectedElement(undefined)
            this.picker.stopMapping();
            params.clicked = false
        }

    }
    _drawMesh(mesh, instance, viewMatrix, projectionMatrix, transformationMatrix) {
        this.shader.bindUniforms({pickerID: instance.components.PickComponent.pickID})

        this.picker.gpu.bindVertexArray(mesh.VAO)
        this.picker.gpu.bindBuffer(this.picker.gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)
        mesh.vertexVBO.enable()

        this.picker.gpu.uniformMatrix4fv(this.shader.transformMatrixULocation, false, transformationMatrix)
        this.picker.gpu.uniformMatrix4fv(this.shader.viewMatrixULocation, false, viewMatrix)
        this.picker.gpu.uniformMatrix4fv(this.shader.projectionMatrixULocation, false, projectionMatrix)
        this.picker.gpu.drawElements(this.picker.gpu.TRIANGLES, mesh.verticesQuantity, this.picker.gpu.UNSIGNED_INT, 0)

        // EXIT
        this.picker.gpu.bindVertexArray(null)
        this.picker.gpu.bindBuffer(this.picker.gpu.ELEMENT_ARRAY_BUFFER, null)
        mesh.vertexVBO.disable()
    }
}