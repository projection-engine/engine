import Component from "../basic/Component";
import {mat4} from "gl-matrix";

export default class PointLightComponent extends Component{
    constructor(id) {
        super(id, PointLightComponent.constructor.name);
    }

    _color = [1, 1, 1]
    _fixedColor = this._color
    cutoffRadius = 10
    attenuation = [1, 0, 0]

    _transformationMatrix = Array.from(mat4.create())
    _position = [0, 0, 0]

    get fixedColor(){
        return this._fixedColor
    }
    get color(){
        return this._color
    }
    set color(data){
        this._color = data

        this._fixedColor = data.map(i => i/255)
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
    get transformationMatrix () {
        return this._transformationMatrix
    }

}