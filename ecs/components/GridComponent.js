import generateGrid from "../../utils/generateGrid";
import {createVBO} from "../../utils/utils";
import {mat4} from "gl-matrix";
import Component from "../basic/Component";

export default class GridComponent extends Component{
    color = [.6, .6, .6, 1]
    _divisions = 30
    _dimension = 100
    scalingMatrix = mat4.create()
    length = 0

    constructor(gpu, division = 30, color, dimension = 100, id) {
        super(id, GridComponent.constructor.name);
        this.gpu = gpu

        this.dimension = dimension
        this.divisions = division

        this.color = color ? color : this.color


    }

    set dimension(d) {
        this._dimension = d
        this.scalingMatrix = mat4.create()
        this.scalingMatrix[0] = this._dimension
        this.scalingMatrix[5] = this._dimension
        this.scalingMatrix[10] = this._dimension
    }

    set divisions(d) {
        this._divisions = d
        const v = generateGrid(this._divisions)
        this.length = v.length
        this.vertexBuffer = createVBO(this.gpu, this.gpu.ARRAY_BUFFER, new Float32Array(v))
    }
}