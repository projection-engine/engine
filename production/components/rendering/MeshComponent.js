import Component from "../Component"
import FALLBACK_MATERIAL from "../../data/FALLBACK_MATERIAL";
import MESH_PROPS from "../../data/component-props/MESH_PROPS";

export default class MeshComponent extends Component {
    name = "MESH"
    _props = MESH_PROPS

    castsShadows = true
    meshID
    materialID = FALLBACK_MATERIAL

    diffuseProbeInfluence
    specularProbeInfluence
    contributeToProbes

    constructor() {
        super()
    }
}