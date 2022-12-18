import Entity from "./Entity";
import GPU from "../GPU";

export default class InstanceBufferController {
    id?:string
    bufferSize = 0
    entities = new Map<string,Entity>()
    transformVBO?:WebGLBuffer

    constructor(materialID) {
        this.id = materialID
        this.transformVBO = GPU.context.createBuffer()
    }

    updateBuffer() {
        this.bufferSize = this.entities.size
        if (this.bufferSize > 0) {
            const data = []
            this.entities.forEach(entity => data.push(Array.from(entity.matrix)))
            const temp = new Float32Array(data.flat())
            GPU.context.bindBuffer(GPU.context.ARRAY_BUFFER, this.transformVBO)
            GPU.context.bufferData(GPU.context.ARRAY_BUFFER, temp, GPU.context.STREAM_DRAW)
        }
    }

    bind() {
        GPU.context.bindBuffer(GPU.context.ARRAY_BUFFER, this.transformVBO)
        GPU.context.enableVertexAttribArray(1)
        GPU.context.enableVertexAttribArray(2)
        GPU.context.enableVertexAttribArray(3)
        GPU.context.enableVertexAttribArray(4)

        GPU.context.vertexAttribPointer(1, 4, GPU.context.FLOAT, false, 64, 0)
        GPU.context.vertexAttribPointer(2, 4, GPU.context.FLOAT, false, 64, 16)
        GPU.context.vertexAttribPointer(3, 4, GPU.context.FLOAT, false, 64, 32)
        GPU.context.vertexAttribPointer(4, 4, GPU.context.FLOAT, false, 64, 48)
        GPU.context.vertexAttribDivisor(1, 1)
        GPU.context.vertexAttribDivisor(2, 1)
        GPU.context.vertexAttribDivisor(3, 1)
        GPU.context.vertexAttribDivisor(4, 1)
    }
}