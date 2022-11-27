import Component from "./Component"
import {mat4} from "gl-matrix"
import DIRECTIONAL_LIGHT_PROPS from "../../static/component-props/DIRECTIONAL_LIGHT_PROPS";

export default class DirectionalLightComponent extends Component {

    name = "DIRECTIONAL_LIGHT"
    _props = DIRECTIONAL_LIGHT_PROPS
    _color = [255, 255, 255]
    fixedColor = [1, 1, 1]
    zNear = 1
    zFar = 10000
    lightView = mat4.create()
    lightProjection = mat4.create()
    size = 35
    atlasFace = [0, 0]
    _center = [0, 0, 0]
    get center(){
        return this._center
    }
    set center(data){
        this._center = data
        this.__entity.needsLightUpdate = true
    }
    changed = true
    _shadowMap = true
    get shadowMap() {
        return this._shadowMap
    }

    set shadowMap(data) {
        if (this._shadowMap !== data)
            this.__entity.needsLightUpdate = true
        this._shadowMap = data
    }

    _intensity = 1
    pcfSamples = 3
    shadowBias = .0001
    shadowAttenuationMinDistance = 50

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
}