import Component from "../basic/Component"
import {mat4} from "gl-matrix"

const M = mat4.create()
export default class DirectionalLightComponent extends Component {
    _color = [255, 255, 255]
    _direction = [0, 0, 0]
    _zNear = -1
    _zFar = 10000
    transformationMatrix =  [...M]
    lightView = [...M]
    lightProjection = [...M]
    _size = 35
    atlasFace = [0,0]
    changed = true
    shadowMap = true
    center = [0, 0, 0]
    _intensity = 1
    fixedColor = [this._color[0] * this.intensity / 255, this._color[1] * this.intensity / 255, this._color[2] * this.intensity / 255]

    constructor(id) {
        super(id)
        this.update()
    }

    get intensity(){
        return this._intensity
    }
    set intensity(data){
        this._intensity= data
        this.fixedColor = [this._color[0] * this.intensity / 255, this._color[1] * this.intensity / 255, this._color[2] * this.intensity / 255]
    }
    get color(){
        return this._color
    }
    set color(data){
        this._color = data
        this.fixedColor = [this._color[0] * this.intensity / 255, this._color[1] * this.intensity / 255, this._color[2] * this.intensity / 255]
    }

    get zNear() {
        return this._zNear
    }
    set zNear(data) {
        this._zNear = data
        this.update()
    }


    get zFar() {
        return this._zFar
    }
    set zFar(data) {
        this._zFar = data
        this.update()
    }


    get direction() {
        return this._direction
    }

    set direction(data) {
        this._direction = data
        this.transformationMatrix[12] = this._direction[0]
        this.transformationMatrix[13] = this._direction[1]
        this.transformationMatrix[14] = this._direction[2]

        this.update()
    }


    get size() {
        return this._size
    }

    set size(data) {
        this._size = data
        this.update()
    }

    update() {
        mat4.lookAt(this.lightView, this._direction, this.center, [0, 1, 0])
        mat4.ortho(this.lightProjection, -this._size, this._size, -this._size, this._size, this._zNear, this._zFar)

        this.changed = true
    }

}