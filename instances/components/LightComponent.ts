import Component from "./Component"
import LIGHT_PROPS from "../../static/component-props/LIGHT_PROPS";
import LIGHT_TYPES from "../../static/LIGHT_TYPES";
import Entity from "../Entity";
import LightsAPI from "../../lib/utils/LightsAPI";
import {mat4} from "gl-matrix";

const toRad = Math.PI / 180

export default class LightComponent extends Component {
    _props = LIGHT_PROPS

    // -------------- GLOBAL --------------
    _color = [255, 255, 255]
    fixedColor = [1, 1, 1]
    _type = LIGHT_TYPES.DIRECTIONAL
    get type() {
        return this._type
    }

    set type(data) {
        const isDifferent = data !== this._type
        this._type = data
        if (isDifferent && Entity.isRegistered(this.entity))
            LightsAPI.packageLights(false, true)
    }

    hasSSS = false
    shadowBias = .0001
    shadowSamples = 3
    zNear = 1
    zFar = 10000
    cutoff = 50
    shadowAttenuationMinDistance = 50

    // -------------- NOT DIRECTIONAL --------------
    attenuation = [0, 0]
    smoothing = .5

    // -------------- SPOTLIGHT --------------
    radius = 45

    // -------------- DIRECTIONAL --------------
    size = 35
    atlasFace = [0, 0]
    __lightView = mat4.create()
    __lightProjection = mat4.create()
    // -------------- AREA --------------
    areaRadius = 1
    planeAreaWidth = 1
    planeAreaHeight = 1

    // -------------- GLOBAL --------------
    _intensity = 1
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

    _shadowMap = true
    get shadowMap() {
        return this._shadowMap
    }

    set shadowMap(data) {
        if (this._shadowMap !== data)
            this.entity.needsLightUpdate = true
        this._shadowMap = data
    }


}