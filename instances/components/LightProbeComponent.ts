import Component from "./Component"
import PROBE_PROPS from "../../static/component-props/ATMOSPHERE_PROPS";
import LIGHT_PROBE_PROPS from "../../static/component-props/LIGHT_PROBE_PROPS";

export default class LightProbeComponent extends Component {
    _props = LIGHT_PROBE_PROPS
    mipmaps = 6
    maxDistance = 50
}