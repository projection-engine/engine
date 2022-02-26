import {createVBO} from "../misc/utils";

export default class VBO {
    constructor(gpu, index, data, type, size, dataType, normalized=false, renderingType) {
        this.gpu  = gpu
        this.id = createVBO(this.gpu, type, data, renderingType)
        this.gpu.vertexAttribPointer(index, size, dataType, normalized, 0, 0)
        this.gpu.bindBuffer(type, null)

        this.index =index
        this.type = type
        this.size = size
        this.normalized = normalized

    }
    enable(){
        this.gpu.enableVertexAttribArray(this.index)
        this.gpu.bindBuffer(this.type, this.id)
        this.gpu.vertexAttribPointer(this.index, this.size, this.type, this.normalized, 0, 0)
    }
    disable(){
        this.gpu.disableVertexAttribArray(this.index)
        this.gpu.bindBuffer(this.type, null)
    }
}