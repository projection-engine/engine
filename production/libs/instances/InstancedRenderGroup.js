export default class InstancedRenderGroup{
    id
    bufferSize = 0
    entities = new Map()

    constructor(materialID) {
        this.id = materialID
        this.transformVBO = gpu.createBuffer()
    }


    updateBuffer(){

        this.bufferSize = this.entities.size
        if(this.bufferSize > 0) {
            const data = []
            this.entities.forEach(entity => data.push(Array.from(entity.transformationMatrix)))
            const temp = new Float32Array(data.flat())
            gpu.bindBuffer(gpu.ARRAY_BUFFER, this.transformVBO)
            gpu.bufferData(gpu.ARRAY_BUFFER, temp, gpu.STREAM_DRAW)
        }
    }
    bind(){
        gpu.bindBuffer(gpu.ARRAY_BUFFER, this.transformVBO)
        gpu.enableVertexAttribArray(1)
        gpu.enableVertexAttribArray(2)
        gpu.enableVertexAttribArray(3)
        gpu.enableVertexAttribArray(4)

        gpu.vertexAttribPointer(1, 4, gpu.FLOAT, false, 64, 0)
        gpu.vertexAttribPointer(2, 4, gpu.FLOAT, false, 64, 16)
        gpu.vertexAttribPointer(3, 4, gpu.FLOAT, false, 64, 32)
        gpu.vertexAttribPointer(4, 4, gpu.FLOAT, false, 64, 48)
        gpu.vertexAttribDivisor(1, 1)
        gpu.vertexAttribDivisor(2, 1)
        gpu.vertexAttribDivisor(3, 1)
        gpu.vertexAttribDivisor(4, 1)
    }
}