import Component from "./Component"
import SPOTLIGHT_PROPS from "../../static/component-props/SPOTLIGHT_PROPS";

export default class SpotlightComponent extends Component {
    _props = SPOTLIGHT_PROPS
    name = "SPOTLIGHT"
    _color = [255, 255, 255]
    direction = [0, 0, 0]
    radius = 90
    intensity = 1
    attenuation = [0, 0]

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
