import VBOInstance from "../instances/VBOInstance"
import MeshInstance from "../instances/MeshInstance";

const LINE = [
    0,0,0,
    0,1,0
]
export default class LineAPI {
    static VAO
    static VBO

    static initialize() {
        if (!LineAPI.VAO) {
            LineAPI.VAO = gpu.createVertexArray()
            gpu.bindVertexArray(LineAPI.VAO)
            LineAPI.VBO = new VBOInstance(
                0,
                new Float32Array(LINE),
                gpu.ARRAY_BUFFER,
                3,
                gpu.FLOAT
            )
        }
    }

    static draw() {
        MeshInstance.finishIfUsed()

        gpu.disable(gpu.CULL_FACE)
        gpu.bindVertexArray(LineAPI.VAO)
        LineAPI.VBO.enable()
        gpu.drawArrays(gpu.LINES, 0, 2)
        gpu.enable(gpu.CULL_FACE)
        gpu.bindVertexArray(null)
    }

    static use() {
        MeshInstance.finishIfUsed()
        gpu.disable(gpu.CULL_FACE)
        gpu.bindVertexArray(LineAPI.VAO)
        LineAPI.VBO.enable()
    }



    static drawInstanced(quantity) {
        gpu.drawArraysInstanced(gpu.LINES, 0, 2, quantity)
    }

    static finish() {
        LineAPI.VBO.disable()
        gpu.bindVertexArray(null)
        gpu.enable(gpu.CULL_FACE)

    }
}