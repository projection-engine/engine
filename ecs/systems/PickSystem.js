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
            setClicked
        } = params

        if(clicked && typeof currentCoords === "object"){

            setClicked(false)
            const filteredMeshes = this._find(entities, e => filteredEntities.meshes[e.id] !== undefined)
            const filtered = this._hasComponent(filteredMeshes)

            this.shader.use()
            this.picker.start()

            const pickerProjection =  this.picker.getProjection(currentCoords, camera)

            for (let m = 0; m < filtered.length; m++) {
                const currentInstance = filtered[m]
                const meshIndex = filteredEntities.meshSources[currentInstance.components.MeshComponent.meshID]
                const mesh = meshes[meshIndex]

                if (mesh !== undefined) {
                    const t = currentInstance.components.TransformComponent
                    this._drawMesh(mesh, currentInstance, camera.viewMatrix, pickerProjection, t.transformationMatrix)
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
                data
            );

            const index = data[0] + data[1] + data[2];

            if (index > 0)
                setSelectedElement(filtered.find(e => e.components.PickComponent.pickID[0] * 255 === index)?.id)
            else
                setSelectedElement(undefined)
            this.picker.stopMapping();

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