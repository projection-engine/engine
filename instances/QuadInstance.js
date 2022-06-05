import {createVAO} from "../utils/utils"
import VBOInstance from "./VBOInstance"

export default class QuadInstance {
    constructor(gpu) {
        this.gpu = gpu
        this.vao = createVAO(gpu)
        this.vbo = new VBOInstance(
            gpu,
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
        this.gpu.bindVertexArray(this.vao)
        this.vbo.enable()
        this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 6);
    }

}