import {createVAO} from "../../utils/utils"
import VBOInstance from "./VBOInstance"

export default class QuadInstance {
    constructor() {
        const gpu = window.gpu
        this.vao = createVAO()
        this.vbo = new VBOInstance(
            0,
            new Float32Array([-1, -1, 0,
                1, -1, 0,
                1, 1, 0,
                1, 1, 0,
                -1, 1, 0,
                -1, -1, 0]),
            gpu.ARRAY_BUFFER,
            3,
            gpu.FLOAT)
    }


    draw() {
        const gpu = window.gpu
        gpu.disable(gpu.CULL_FACE)
        gpu.bindVertexArray(this.vao)
        this.vbo.enable()
        gpu.drawArrays(gpu.TRIANGLES, 0, 6)
        gpu.enable(gpu.CULL_FACE)
    }

}