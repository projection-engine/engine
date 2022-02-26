import {createVBO} from "../../utils/misc/utils";


export default class GridInstance {
    length = 0

    constructor(gpu) {
        this.gpu = gpu
        this.length = 6
        this.vertexBuffer = createVBO(
            this.gpu,
            this.gpu.ARRAY_BUFFER,
            new Float32Array(
            [
                -1, -1, 0,
                 1, -1, 0,
                 1,  1, 0,
                 1,  1, 0,
                -1,  1, 0,
                -1, -1, 0
            ]))
    }

}