import cube from "../../samples/skyBoxCube";
import {createVBO} from "../../utils/utils";

export default class Light {
    position = [0, 0, 0]
    vertexBuffer
    constructor(gpu, ambientColor = [1, 1, 1], diffuse = [0, 0, 0], specular = [.5, .5, .5], name) {
        this.diffuse = diffuse
        this.ambientColor = ambientColor
        this.specular = specular
        this.name = name
        this.gpu = gpu
        this._initializeMesh()
    }

    _initializeMesh() {
        this.vertexBuffer = createVBO(this.gpu, this.gpu.ARRAY_BUFFER, new Float32Array(cube))
    }

    draw({shader, viewMatrix, projectionMatrix}) {

        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.vertexBuffer)
        this.gpu.enableVertexAttribArray(shader.positionLocation)
        this.gpu.vertexAttribPointer(shader.positionLocation, 3, this.gpu.FLOAT, false, 0, 0)
        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.vertexBuffer)


        this.gpu.uniform3fv(shader.colorULocation, this.ambientColor)
        this.gpu.uniformMatrix4fv(shader.transformationMatrixULocation, false, [
            1, 0, 0, this.position[0],
            0, 1, 0, this.position[1],
            0, 0, 1, this.position[2],
            0, 0, 0, 1
        ])

        this.gpu.uniformMatrix4fv(shader.viewMatrixULocation, false, viewMatrix)
        this.gpu.uniformMatrix4fv(shader.projectionMatrixULocation, false, projectionMatrix)

        this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 36)
        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, null)


    }
}