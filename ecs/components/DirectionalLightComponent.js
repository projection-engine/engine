import Component from "../basic/Component";
import {mat4} from "gl-matrix";

export default class DirectionalLightComponent extends Component {
    _color = [1, 1, 1]
    _direction = [0, 0, 0]
    _zNear = -1
    _zFar = 10000
    _transformationMatrix = Array.from(mat4.create())
    lightView = Array.from(mat4.create())
    _lightProjection = Array.from(mat4.create())
    _size = 35
    _atlasFace = [0,0]
    _fixedColor = this._color
    _changed = true
    shadowMap = true
    center = [0, 0, 0]

    constructor(id) {
        super(id, 'DirectionalLightComponent');
        this._update()

    }
    get changed(){
        return this._changed
    }
    set changed(_){
        this._changed = false
    }


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

    set atlasFace(data){
        this._atlasFace = data
    }
    get atlasFace(){
        return this._atlasFace
    }
    get zNear() {
        return this._zNear
    }

    set zNear(data) {
        this._zNear = data
        this._update()
    }


    get zFar() {
        return this._zFar
    }

    set zFar(data) {
        this._zFar = data
        this._update()
    }


    get direction() {
        return this._direction
    }

    set direction(data) {
        this._direction = data
        this._update()


        this._transformationMatrix[12] = data[0]
        this._transformationMatrix[13] = data[1]
        this._transformationMatrix[14] = data[2]
    }

    get transformationMatrix() {
        return this._transformationMatrix
    }

    get size() {
        return this._size
    }

    set size(data) {
        this._size = data
        this._update()
    }
    set lightProjection(data){}
    get lightProjection(){
        return this._lightProjection
    }

    get centerPoint(){
        return this.center
    }
    set centerPoint(data){
        this.center = data
    }
    _update() {
        this.lightView = []
        mat4.lookAt(this.lightView, this._direction, this.center, [0, 1, 0])

        this._lightProjection = []
        mat4.ortho(this._lightProjection, -this._size, this._size, -this._size, this._size, this._zNear, this._zFar);

        this._changed = true
    }

}