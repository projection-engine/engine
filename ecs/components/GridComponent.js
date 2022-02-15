import {createVBO} from "../../utils/utils";
import Component from "../basic/Component";


export default class GridComponent extends Component {
    length = 0

    constructor(gpu, division = 1, color, dimension = 50, id) {
        super(id, GridComponent.constructor.name);
        this.gpu = gpu

        this.length = 6
        this.vertexBuffer = createVBO(
            this.gpu
            , this.gpu.ARRAY_BUFFER,
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