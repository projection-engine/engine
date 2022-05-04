import {createVBO} from "../utils/utils";

export default class VBO {
    constructor(gpu, index, data, type, size, dataType, normalized=false, renderingType, stride=0) {
        this.gpu  = gpu

        this.id = createVBO(this.gpu, type, data, renderingType)

        this.gpu.vertexAttribPointer(
            index,
            size,
            dataType,
            normalized,
            stride,
            0)
        this.gpu.bindBuffer(type, null)

        this.stride= stride
        this.index =index
        this.type = type
        this.size = size
        this.normalized = normalized

        this.length = data.length
    }
    enable(){
        this.gpu.enableVertexAttribArray(this.index)
        this.gpu.bindBuffer(this.type, this.id)
        this.gpu.vertexAttribPointer(this.index, this.size, this.type, this.normalized, this.stride, 0)
    }
    disable(){
        this.gpu.disableVertexAttribArray(this.index)
        this.gpu.bindBuffer(this.type, null)
    }
}