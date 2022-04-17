import Component from "../basic/Component";
import {mat4} from "gl-matrix";

export default class DirectionalLightComponent extends Component {
    _color = [255, 255, 255]
    _direction = [0, 0, 0]
    _zNear = -1
    _zFar = 10000
    _transformationMatrix = Array.from(mat4.create())
    _lightView = Array.from(mat4.create())
    _lightProjection = Array.from(mat4.create())
    _size = 35
    _atlasFace = [0,0]

    _changed = true
    _shadowMap = true
    _center = [0, 0, 0]

    constructor(id) {
        super(id, 'DirectionalLightComponent');
        this._update()

    }
    get shadowMap(){
        return this._shadowMap
    }
    set shadowMap(data){
        this._shadowMap = data
    }

    get lightView(){
        return this._lightView
    }
    set lightView(data){
        this._lightView = data
    }

    get changed(){
        return this._changed
    }
    set changed(_){
        this._changed = false
    }


    get fixedColor(){
        return  this._color.map(i => i/255)
    }
    get color(){
        return this._color
    }
    set color(data){
        this._color = data

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

    get center(){
        return this._center
    }
    set center(data){
        this._center = data
    }
    _update() {
        this._lightView = []
        mat4.lookAt(this._lightView, this._direction, this._center, [0, 1, 0])

        this._lightProjection = []
        mat4.ortho(this._lightProjection, -this._size, this._size, -this._size, this._size, this._zNear, this._zFar);

        this._changed = true
    }

}