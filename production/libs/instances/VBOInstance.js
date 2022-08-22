import {createVBO} from "../../utils/utils"

export default class VBOInstance {
    constructor(  index, data, type, size, dataType, normalized=false, renderingType, stride=0) {
        this.id = createVBO( type, data, renderingType)

        gpu.vertexAttribPointer(
            index,
            size,
            dataType,
            normalized,
            stride,
            0)
        gpu.bindBuffer(type, null)

        this.stride= stride
        this.index =index
        this.type = type
        this.size = size
        this.normalized = normalized

        this.length = data.length
    }
    enable(){
        gpu.enableVertexAttribArray(this.index)
        gpu.bindBuffer(this.type, this.id)
        gpu.vertexAttribPointer(this.index, this.size, this.type, this.normalized, this.stride, 0)
    }
    disable(){
        gpu.disableVertexAttribArray(this.index)
        gpu.bindBuffer(this.type, null)
    }

    delete(){
        gpu.deleteBuffer(this.id)
    }
}