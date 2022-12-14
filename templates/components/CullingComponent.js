import Component from "./Component";
import CULLING_COMPONENT_PROPS from "../../static/component-props/CULLING_COMPONENT_PROPS";

export default class CullingComponent extends Component{
    _props = CULLING_COMPONENT_PROPS
    name = "CULLING"
    _distance = 100
    _distanceCulling = false

    get distanceCulling(){
        return this._distanceCulling
    }
    set distanceCulling(data){
        this._distanceCulling = data
        this.__entity.__cullingMetadata[2] = data ? 1 : 0
    }

    get distance(){
        return this._distance
    }
    set distance(data){
        this._distance = data
        this.__entity.__cullingMetadata[1] = data
    }

    occlusionCulling
}