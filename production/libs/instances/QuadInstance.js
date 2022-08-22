import VBOInstance from "./VBOInstance"

const QUAD = [
    -1, -1, 0,
    1, -1, 0,
    1, 1, 0,
    1, 1, 0,
    -1, 1, 0,
    -1, -1, 0
]
export default class QuadInstance {
    constructor() {
        this.vao = gpu.createVertexArray()
        gpu.bindVertexArray(this.vao)
        this.vbo = new VBOInstance(
            0,
            new Float32Array(QUAD),
            gpu.ARRAY_BUFFER,
            3,
            gpu.FLOAT)
    }

    draw() {
        gpu.disable(gpu.CULL_FACE)
        gpu.bindVertexArray(this.vao)
        this.vbo.enable()
        gpu.drawArrays(gpu.TRIANGLES, 0, 6)
        gpu.enable(gpu.CULL_FACE)
    }

}