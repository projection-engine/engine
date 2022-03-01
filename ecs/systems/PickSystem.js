import System from "../basic/System";
import MousePickerFramebuffer from "../../elements/buffer/mics/MousePickerFramebuffer";
import PickerShader from "../../shaders/classes/misc/PickerShader";

export default class PickSystem extends System {
    constructor(gpu) {
        super([]);
        this.picker = new MousePickerFramebuffer(gpu)
        this.shader = new PickerShader(gpu)
    }

    execute(options, systems, data) {
        super.execute()
        const  {
            pointLights,
            spotLights,
            terrains,
            meshes,
            skybox,
            directionalLights,
            materials,
            meshSources,
            cubeMaps
        } = data

        const  {
            setSelected,
            currentCoords,
            clicked,


            camera,
            setClicked
        } = options

        if(clicked && typeof currentCoords === "object"){

            setClicked(false)

            this.shader.use()
            this.picker.start()

            const pickerProjection =  this.picker.getProjection(currentCoords, camera)

            for (let m = 0; m < meshes.length; m++) {
                const currentInstance = meshes[m]
                const mesh  = meshSources[currentInstance.components.MeshComponent.meshID]

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
                setSelected([meshes.find(e => e.components.PickComponent.pickID[0] * 255 === index)?.id])
            else
                setSelected([])
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