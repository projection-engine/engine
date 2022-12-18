import GPUAPI from "../lib/rendering/GPUAPI";
import GPU from "../GPU";

export default class VertexBuffer {
    private readonly id: WebGLBuffer
    private readonly stride: number
    private readonly index: number
    private readonly type: number
    private readonly size: number
    private readonly normalized: boolean
    length: number = 0

    constructor(index: number, data, type: number, size: number, dataType: number, normalized?: boolean, renderingType?: number, stride?: number) {
        this.id = GPUAPI.createBuffer(type, data, renderingType)

        GPU.context.vertexAttribPointer(
            index,
            size,
            dataType,
            normalized,
            stride||0,
            0)
        GPU.context.bindBuffer(type, null)

        this.stride = stride || 0
        this.index = index
        this.type = type
        this.size = size
        this.normalized = normalized

        this.length = data.length
    }

    enable() {
        GPU.context.enableVertexAttribArray(this.index)
        GPU.context.bindBuffer(this.type, this.id)
        GPU.context.vertexAttribPointer(this.index, this.size, this.type, this.normalized, this.stride, 0)
    }

    disable() {
        GPU.context.disableVertexAttribArray(this.index)
        GPU.context.bindBuffer(this.type, null)
    }

    delete() {
        GPU.context.deleteBuffer(this.id)
    }
}