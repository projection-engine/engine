import Component from "./Component";
import CULLING_COMPONENT_PROPS from "../../static/component-props/CULLING_COMPONENT_PROPS";

export default class CullingComponent extends Component{
    _props = CULLING_COMPONENT_PROPS
    name = "CULLING"
    distance = 100
    distanceCulling = false

    occlusionCulling
}