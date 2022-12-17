import Component from "./Component"
import PROBE_PROPS from "../../static/component-props/SKYLIGHT_PROPS";

export default class SkyLightComponent extends Component {
    _props = PROBE_PROPS
    resolution = 128
    mipmaps = 6
    radius = 50
}