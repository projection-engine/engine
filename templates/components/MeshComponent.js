import Component from "./Component"

import MESH_PROPS from "../../static/component-props/MESH_PROPS";
import MaterialAPI from "../../lib/rendering/MaterialAPI";

export default class MeshComponent extends Component {
    name = "MESH"
    _props = MESH_PROPS


    castsShadows = true
    _meshID
    _materialID

    __texturesInUse = {}
    __mappedUniforms = {}
    uniformsToOverride = []

    set materialUniforms(data) {
        this.uniformsToOverride = data
        console.trace(data)
        MaterialAPI.mapUniforms(data, this.__texturesInUse, this.__mappedUniforms).catch(err => console.error(err))
    }

    get materialUniforms() {
        return this.uniformsToOverride
    }

    contributeToProbes = true
    overrideMaterialUniforms = false

    set meshID(data) {
        this._meshID = data
        MaterialAPI.updateMap(this)
    }

    get meshID() {
        return this._meshID
    }

    set materialID(data) {
        this._materialID = data
        if (data) {
            const previous = MaterialAPI.entityMaterial.get(this._materialID) || {}
            previous[this.__entity.id] = this.__entity
            MaterialAPI.entityMaterial.set(this._materialID, previous)
        } else if (this.__entity.__materialRef) {
            const old = MaterialAPI.entityMaterial.get(this.__entity.__materialRef.id)
            delete old[this.__entity.id]
        }
        MaterialAPI.updateMap(this)
    }

    get materialID() {
        return this._materialID
    }

}