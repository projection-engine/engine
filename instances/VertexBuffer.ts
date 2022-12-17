import GPUAPI from "../lib/rendering/GPUAPI";

export default class VertexBuffer {
    private readonly id:WebGLBuffer
    private readonly stride:number
    private readonly index:number
    private readonly type:number
    private readonly size:number
    private readonly normalized:boolean
    length:number = 0
    constructor(index:number, data, type:number, size, dataType, normalized:boolean = false, renderingType, stride = 0) {
        this.id = GPUAPI.createBuffer(type, data, renderingType)

        gpu.vertexAttribPointer(
            index,
            size,
            dataType,
            normalized,
            stride,
            0)
        gpu.bindBuffer(type, null)

        this.stride         = stride
        this.index      = index
        this.type       = type
        this.size       = size
        this.normalized = normalized

        this.length = data.length
    }

    enable() {
        gpu.enableVertexAttribArray(this.index)
        gpu.bindBuffer(this.type, this.id)
        gpu.vertexAttribPointer(this.index, this.size, this.type, this.normalized, this.stride, 0)
    }

    disable() {
        gpu.disableVertexAttribArray(this.index)
        gpu.bindBuffer(this.type, null)
    }

    delete() {
        gpu.deleteBuffer(this.id)
    }
}