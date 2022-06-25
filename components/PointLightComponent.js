import Component from "../basic/Component"

export default class PointLightComponent extends Component {
    _color = [255, 255, 255]

    attenuation = [1, 0, 0]
    _changed = true

    _zNear = 1
    _zFar = 1000
    shadowMap = true
    intensity = 1


    constructor(id) {
        super(id, PointLightComponent.constructor.name)
    }

    get zNear() {
        return this._zNear
    }

    set zNear(data) {
        this._zNear = data
        this._changed = true
    }


    get zFar() {
        return this._zFar
    }

    set zFar(data) {
        this._zFar = data
        this._changed = true
    }


    get changed() {
        return this._changed
    }

    set changed(_) {
        this._changed = false
    }


    get fixedColor() {
        return [this._color[0] * this.intensity / 255, this._color[1] * this.intensity / 255, this._color[2] * this.intensity / 255]
    }

    get color() {
        return this._color
    }

    set color(data) {
        this._color = data

    }


}
