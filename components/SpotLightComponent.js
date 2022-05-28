import Component from "../basic/Component";
import {mat4} from "gl-matrix";

export default class SpotLightComponent extends Component{
    color = [255, 255, 255]
    cutoff = 0
    direction = [0, 0, 0]

    _transformationMatrix = Array.from(mat4.create())
    _position = [0, 0, 0]

    constructor(id) {
        super(id, SpotLightComponent.constructor.name);
    }


    get position () {
        return this._position
    }
    set position (data) {
        this._position = data

        this._transformationMatrix[12] = data[0]
        this._transformationMatrix[13] = data[1]
        this._transformationMatrix[14] = data[2]
    }
    get fixedColor(){
        return this.color.map(i => i/255)
    }
    get transformationMatrix () {
        return this._transformationMatrix
    }

}