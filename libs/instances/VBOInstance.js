import {createVBO} from "../../utils/utils"

export default class VBOInstance {
    constructor(  index, data, type, size, dataType, normalized=false, renderingType, stride=0) {
        this.id = createVBO( type, data, renderingType)

        window.gpu.vertexAttribPointer(
            index,
            size,
            dataType,
            normalized,
            stride,
            0)
        window.gpu.bindBuffer(type, null)

        this.stride= stride
        this.index =index
        this.type = type
        this.size = size
        this.normalized = normalized

        this.length = data.length
    }
    enable(){
        window.gpu.enableVertexAttribArray(this.index)
        window.gpu.bindBuffer(this.type, this.id)
        window.gpu.vertexAttribPointer(this.index, this.size, this.type, this.normalized, this.stride, 0)
    }
    disable(){
        window.gpu.disableVertexAttribArray(this.index)
        window.gpu.bindBuffer(this.type, null)
    }

    delete(){
        window.gpu.deleteBuffer(this.id)
    }
}