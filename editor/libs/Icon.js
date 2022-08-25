import CameraAPI from "../../production/libs/apis/CameraAPI";
import IconsSystem from "../services/IconsSystem";

export default class Icon {
    bufferSize = 0
    constructor() {
        this.transformVBO = gpu.createBuffer()
    }


    updateBuffer(data){
        this.bufferSize = data.length
        console.trace(data)
        if(this.bufferSize > 0) {

            const temp = new Float32Array(data.map(d => Array.from(d)).flat())
            gpu.bindBuffer(gpu.ARRAY_BUFFER, this.transformVBO)
            gpu.bufferData(gpu.ARRAY_BUFFER, temp, gpu.STREAM_DRAW)
        }
    }
    bind(){
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
    draw(texture, iconSize, shader) {
        if (this.bufferSize > 0) {
            gpu.bindBuffer(gpu.ARRAY_BUFFER, this.transformVBO)
            this.bind()
            shader.bindForUse({
                cameraPosition: CameraAPI.position,
                iconSampler: texture,
                viewMatrix: CameraAPI.viewMatrix,
                projectionMatrix: CameraAPI.projectionMatrix,
                iconSize
            })
            IconsSystem.quad.drawInstanced(this.bufferSize)
            gpu.bindBuffer(gpu.ARRAY_BUFFER,null)
        }
    }
}