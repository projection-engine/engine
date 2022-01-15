import generateGrid from "../../utils/generateGrid";
import {createVBO} from "../../utils/utils";

export default class Grid {
    constructor(gpu) {
        const data = generateGrid(50, 5)

        this.indicesSize = data.indices.length
        this.gpu = gpu

        this.vertexBuffer = createVBO(this.gpu, this.gpu.ARRAY_BUFFER, new Float32Array(data.vertices))
        this.indexBuffer = createVBO(this.gpu, this.gpu.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices))
    }


    draw(shader, viewM, projectionM) {
        this.gpu.enableVertexAttribArray(shader.positionLocation)
        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this.vertexBuffer)
        this.gpu.vertexAttribPointer(shader.positionLocation, 3, this.gpu.FLOAT, false, 0, 0)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, this.indexBuffer)

        this.gpu.uniformMatrix4fv(shader.viewMatrixULocation, false, viewM.flat())
        this.gpu.uniformMatrix4fv(shader.projectionMatrixULocation, false, projectionM)

        this.gpu.drawElements(this.gpu.LINE_STRIP, this.indicesSize, this.gpu.UNSIGNED_SHORT, 0)
    }
}