import Component from "./Component"
import POINT_LIGHT_PROPS from "../../static/component-props/POINT_LIGHT_PROPS";

export default class SpotlightComponent extends Component {
    _props = POINT_LIGHT_PROPS
    name = "SPOTLIGHT"
    _color = [255, 255, 255]
    cutoff = 500
    outerCutoff = 1000
    intensity = 1


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
