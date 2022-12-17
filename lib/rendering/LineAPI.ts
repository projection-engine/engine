import VertexBuffer from "../../instances/VertexBuffer"
import Mesh from "../../instances/Mesh";

const X = [
        0, 0, 0,
        1, 0, 0
    ],
    Y = [
        0, 0, 0,
        0, 1, 0
    ],
    Z = [
        0, 0, 0,
        0, 0, 1
    ]
export default class LineAPI {
    static vaoX
    static vboX

    static vaoY
    static vboY

    static vaoZ
    static vboZ
    static #initialized = false


    static initialize() {
        if (LineAPI.#initialized) return
        LineAPI.#initialized = true

        LineAPI.vaoX = gpu.createVertexArray()
        gpu.bindVertexArray(LineAPI.vaoX)
        LineAPI.vboX = new VertexBuffer(
            0,
            new Float32Array(X),
            gpu.ARRAY_BUFFER,
            3,
            gpu.FLOAT
        )
        gpu.bindVertexArray(null)

        LineAPI.vaoY = gpu.createVertexArray()
        gpu.bindVertexArray(LineAPI.vaoY)
        LineAPI.vboY = new VertexBuffer(
            0,
            new Float32Array(Y),
            gpu.ARRAY_BUFFER,
            3,
            gpu.FLOAT
        )
        gpu.bindVertexArray(null)

        LineAPI.vaoZ = gpu.createVertexArray()
        gpu.bindVertexArray(LineAPI.vaoZ)
        LineAPI.vboZ = new VertexBuffer(
            0,
            new Float32Array(Z),
            gpu.ARRAY_BUFFER,
            3,
            gpu.FLOAT
        )

    }

    static drawX() {
        const vbo = LineAPI.vboX,
            vao = LineAPI.vaoX

        Mesh.finishIfUsed()

        gpu.bindVertexArray(vao)
        vbo.enable()
        gpu.drawArrays(gpu.LINES, 0, 2)

        gpu.bindVertexArray(null)
        vbo.disable()
    }

    static drawY() {
        const vbo = LineAPI.vboY,
            vao = LineAPI.vaoY


        Mesh.finishIfUsed()

        gpu.bindVertexArray(vao)
        vbo.enable()
        gpu.drawArrays(gpu.LINES, 0, 2)


        gpu.bindVertexArray(null)
        vbo.disable()
    }


    static drawZ() {
        const vbo = LineAPI.vboZ,
            vao = LineAPI.vaoZ

        Mesh.finishIfUsed()

        gpu.bindVertexArray(vao)
        vbo.enable()
        gpu.drawArrays(gpu.LINES, 0, 2)

        gpu.bindVertexArray(null)
        vbo.disable()
    }

}