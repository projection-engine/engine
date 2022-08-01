import Component from "../basic/Component"
import PROBE_PROPS from "../component-props/PROBE_PROPS";

export default class ProbeComponent extends Component {
    get isNative(){
        return true
    }
    _props = PROBE_PROPS
    get isDiffuse(){
        return !this.specularProbe
    }
    resolution = 128
    mipmaps = 6
    radius = 50
    multiplier = [1,1,1]
    specularProbe = false
    constructor(id, resolution) {
        super(id)
        if (resolution)
            this.resolution = resolution
    }
}