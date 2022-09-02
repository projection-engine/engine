import VBOInstance from "./VBOInstance"
import MeshInstance from "./MeshInstance";

const QUAD = [
    -1, -1, 0,
    1, -1, 0,
    1, 1, 0,
    1, 1, 0,
    -1, 1, 0,
    -1, -1, 0
]
export default class QuadInstance {
    static VAO
    static VBO
    constructor() {
        if(!QuadInstance.VAO) {
            QuadInstance.VAO = gpu.createVertexArray()
            gpu.bindVertexArray(QuadInstance.VAO)
            QuadInstance.VBO = new VBOInstance(
                0,
                new Float32Array(QUAD),
                gpu.ARRAY_BUFFER,
                3,
                gpu.FLOAT
            )
        }
    }

    draw() {
        MeshInstance.finishIfUsed()

        gpu.disable(gpu.CULL_FACE)
        gpu.bindVertexArray(QuadInstance.VAO)
        QuadInstance.VBO.enable()
        gpu.drawArrays(gpu.TRIANGLES, 0, 6)
        gpu.enable(gpu.CULL_FACE)
        gpu.bindVertexArray(null)
    }

    use() {
        MeshInstance.finishIfUsed()
        gpu.disable(gpu.CULL_FACE)
        gpu.bindVertexArray(QuadInstance.VAO)
        QuadInstance.VBO.enable()
    }
    drawQuad(){
        gpu.drawArrays(gpu.TRIANGLES, 0, 6)
    }
    drawInstanced(quantity){
        gpu.drawArraysInstanced(gpu.TRIANGLES, 0, 6, quantity)
    }
    finish(){
        QuadInstance.VBO.disable()
        gpu.bindVertexArray(null)
        gpu.enable(gpu.CULL_FACE)

    }
}