import Component from "./Component"
import POINT_LIGHT_PROPS from "../../static/component-props/POINT_LIGHT_PROPS";

export default class PointLightComponent extends Component {

    _props = POINT_LIGHT_PROPS
    name = "POINT_LIGHT"
    _color = [255, 255, 255]

    attenuation = [0, 0]
    _changed = true

    _zNear = .1
    _zFar = 25
    smoothing = .5
    outerCutoff = 200

    _shadowMap = true
    shadowAttenuationMinDistance = 50
    hasSSS = false
    get shadowMap() {
        return this._shadowMap
    }

    set shadowMap(data) {
        if (this._shadowMap !== data)
            this.__entity.needsLightUpdate = true
        this._shadowMap = data
    }

    intensity = 1
    shadowSamples = 10
    shadowBias = .05

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
