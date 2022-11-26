import Component from "./Component"
import FALLBACK_MATERIAL from "../../static/FALLBACK_MATERIAL";
import MESH_PROPS from "../../static/component-props/MESH_PROPS";
import MaterialAPI from "../../lib/rendering/MaterialAPI";

export default class MeshComponent extends Component {
    name = "MESH"
    _props = MESH_PROPS

    castsShadows = true
    _meshID
    _materialID = FALLBACK_MATERIAL
    __mapSource = {
        type: undefined,
        index: undefined
    }

    diffuseProbeInfluence = true
    specularProbeInfluence = true
    contributeToProbes = true

    set meshID(data) {
        if (this._meshID === data)
            return
        this._meshID = data
        if (!data && typeof this.__mapSource.index === "number") {
            MaterialAPI[this.__mapSource.type].splice(this.__mapSource.index, 1)
            this.__mapSource = {}
        } else if (data)
            MaterialAPI.updateMap(this)
    }

    get meshID() {
        return this._meshID
    }

    set materialID(data) {
        if (this._materialID === data)
            return
        this._materialID = data

        if (!data && typeof this.__mapSource.index === "number") {
            MaterialAPI[this.__mapSource.type].splice(this.__mapSource.index, 1)
            this.__mapSource = {}
        } else if (data)
            MaterialAPI.updateMap(this)
    }

    get materialID() {
        return this._materialID
    }

}