import VertexBuffer from "../../instances/VertexBuffer"
import Mesh from "../../instances/Mesh";
import GPU from "../../GPU";

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

        LineAPI.vaoX = GPU.context.createVertexArray()
        GPU.context.bindVertexArray(LineAPI.vaoX)
        LineAPI.vboX = new VertexBuffer(
            0,
            new Float32Array(X),
            GPU.context.ARRAY_BUFFER,
            3,
            GPU.context.FLOAT
        )
        GPU.context.bindVertexArray(null)

        LineAPI.vaoY = GPU.context.createVertexArray()
        GPU.context.bindVertexArray(LineAPI.vaoY)
        LineAPI.vboY = new VertexBuffer(
            0,
            new Float32Array(Y),
            GPU.context.ARRAY_BUFFER,
            3,
            GPU.context.FLOAT
        )
        GPU.context.bindVertexArray(null)

        LineAPI.vaoZ = GPU.context.createVertexArray()
        GPU.context.bindVertexArray(LineAPI.vaoZ)
        LineAPI.vboZ = new VertexBuffer(
            0,
            new Float32Array(Z),
            GPU.context.ARRAY_BUFFER,
            3,
            GPU.context.FLOAT
        )

    }

    static drawX() {
        const vbo = LineAPI.vboX,
            vao = LineAPI.vaoX

        Mesh.finishIfUsed()

        GPU.context.bindVertexArray(vao)
        vbo.enable()
        GPU.context.drawArrays(GPU.context.LINES, 0, 2)

        GPU.context.bindVertexArray(null)
        vbo.disable()
    }

    static drawY() {
        const vbo = LineAPI.vboY,
            vao = LineAPI.vaoY


        Mesh.finishIfUsed()

        GPU.context.bindVertexArray(vao)
        vbo.enable()
        GPU.context.drawArrays(GPU.context.LINES, 0, 2)


        GPU.context.bindVertexArray(null)
        vbo.disable()
    }


    static drawZ() {
        const vbo = LineAPI.vboZ,
            vao = LineAPI.vaoZ

        Mesh.finishIfUsed()

        GPU.context.bindVertexArray(vao)
        vbo.enable()
        GPU.context.drawArrays(GPU.context.LINES, 0, 2)

        GPU.context.bindVertexArray(null)
        vbo.disable()
    }

}