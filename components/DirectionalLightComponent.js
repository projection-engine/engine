import Component from "../basic/Component"
import {mat4} from "gl-matrix"
import COMPONENTS from "../data/COMPONENTS"
import DIRECTIONAL_LIGHT_PROPS from "../component-props/DIRECTIONAL_LIGHT_PROPS";

export default class DirectionalLightComponent extends Component {
    get isNative(){
        return true
    }
    _props = DIRECTIONAL_LIGHT_PROPS
    _color = [255, 255, 255]
    fixedColor = [1, 1, 1]
    transformationComponent
    _zNear = -1
    _zFar = 10000
    lightView = mat4.create()
    lightProjection = mat4.create()
    _size = 35
    atlasFace = [0, 0]
    changed = true
    shadowMap = true
    center = [0, 0, 0]
    _intensity = 1


    constructor(id, entity) {
        super(id)
        if (!entity)
            throw new Error("Transformation component-editor needed")
        this.transformationComponent = entity.components[COMPONENTS.TRANSFORM]
    }

    get intensity() {
        return this._intensity
    }

    set intensity(data) {
        this._intensity = data
        this.fixedColor = [this._color[0] * this.intensity / 255, this._color[1] * this.intensity / 255, this._color[2] * this.intensity / 255]
    }

    get color() {
        return this._color
    }

    set color(data) {
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
        return this.transformationComponent.translation
    }

    set direction(data) {
        this.transformationComponent.translation = data
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
        mat4.lookAt(this.lightView, this.transformationComponent.translation, this.center, [0, 1, 0])
        mat4.ortho(this.lightProjection, -this._size, this._size, -this._size, this._size, this._zNear, this._zFar)

        this.changed = true
    }


}