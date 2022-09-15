
export default class VBOController {
    // static lastUsed
    constructor(index, data, type, size, dataType, normalized = false, renderingType, stride = 0) {
        this.id = VBOController.createVBO(type, data, renderingType)

        gpu.vertexAttribPointer(
            index,
            size,
            dataType,
            normalized,
            stride,
            0)
        gpu.bindBuffer(type, null)

        this.stride = stride
        this.index = index
        this.type = type
        this.size = size
        this.normalized = normalized

        this.length = data.length
    }

    enable() {
        // VBOController.lastUsed = this.id
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

    static createVBO(type, data, renderingType = gpu.STATIC_DRAW) {
        if (!data && data.buffer instanceof ArrayBuffer && data.byteLength !== undefined || data.length === 0)
            return null

        const buffer = gpu.createBuffer()
        gpu.bindBuffer(type, buffer)
        gpu.bufferData(type, data, renderingType)

        return buffer
    }
}