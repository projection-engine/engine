import Component from "../Component"
import FALLBACK_MATERIAL from "../../../static/materials/FALLBACK_MATERIAL";
import MESH_PROPS from "../../../static/component-props/MESH_PROPS";

export default class MeshComponent extends Component {
    name = "MESH"
    _props = MESH_PROPS

    castsShadows = true
    meshID
    materialID = FALLBACK_MATERIAL

    diffuseProbeInfluence
    specularProbeInfluence
    contributeToProbes
}