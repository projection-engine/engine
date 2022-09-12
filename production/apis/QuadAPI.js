import VBOInstance from "../instances/VBOInstance"
import MeshInstance from "../instances/MeshInstance";

const QUAD = [
    -1, -1, 0,
    1, -1, 0,
    1, 1, 0,
    1, 1, 0,
    -1, 1, 0,
    -1, -1, 0
]
export default class QuadAPI {
    static VAO
    static VBO

    static initialize() {
        if (!QuadAPI.VAO) {
            QuadAPI.VAO = gpu.createVertexArray()
            gpu.bindVertexArray(QuadAPI.VAO)
            QuadAPI.VBO = new VBOInstance(
                0,
                new Float32Array(QUAD),
                gpu.ARRAY_BUFFER,
                3,
                gpu.FLOAT
            )
        }
    }

    static draw() {
        MeshInstance.finishIfUsed()

        gpu.disable(gpu.CULL_FACE)
        gpu.bindVertexArray(QuadAPI.VAO)
        QuadAPI.VBO.enable()
        gpu.drawArrays(gpu.TRIANGLES, 0, 6)
        gpu.enable(gpu.CULL_FACE)
        gpu.bindVertexArray(null)
    }

    static use() {
        MeshInstance.finishIfUsed()
        gpu.disable(gpu.CULL_FACE)
        gpu.bindVertexArray(QuadAPI.VAO)
        QuadAPI.VBO.enable()
    }

    static drawQuad() {
        gpu.drawArrays(gpu.TRIANGLES, 0, 6)
    }


    static drawInstanced(quantity) {
        gpu.drawArraysInstanced(gpu.TRIANGLES, 0, 6, quantity)
    }

    static finish() {
        QuadAPI.VBO.disable()
        gpu.bindVertexArray(null)
        gpu.enable(gpu.CULL_FACE)

    }
}