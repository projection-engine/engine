import Component from "../basic/Component"

export default class ProbeComponent extends Component {
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