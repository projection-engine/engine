import Component from "./Component";
import CULLING_COMPONENT_PROPS from "../../static/component-props/CULLING_COMPONENT_PROPS";

export default class CullingComponent extends Component{
    _props = CULLING_COMPONENT_PROPS
    screenDoorEffect = false
    _screenDoorEffectDistanceMultiplier = .5
    _distance = 100
    _distanceCulling = false

    get screenDoorEffectDistanceMultiplier(){
        return this._screenDoorEffectDistanceMultiplier
    }
    set screenDoorEffectDistanceMultiplier(data){
        this._screenDoorEffectDistanceMultiplier = data
        this.__entity.__cullingMetadata[4] = data
    }
    get distanceCulling(){
        return this._distanceCulling
    }
    set distanceCulling(data){
        this._distanceCulling = data
        this.__entity.__cullingMetadata[2] = data ? 1 : 0
        this.__entity.__cullingMetadata[3] = 0
    }

    get distance(){
        return this._distance
    }
    set distance(data){
        this._distance = data
        this.__entity.__cullingMetadata[1] = data
    }
    get screenDoorEnabled(){
        return this.__entity.__cullingMetadata[5] === 1
    }
    occlusionCulling
}