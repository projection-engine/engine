import Component from "./Component"
import FALLBACK_MATERIAL from "../../static/FALLBACK_MATERIAL";
import MESH_PROPS from "../../static/component-props/MESH_PROPS";
import MaterialAPI from "../../api/rendering/MaterialAPI";
import GPU from "../../GPU";
import MATERIAL_RENDERING_TYPES from "../../static/MATERIAL_RENDERING_TYPES";
import FileSystemAPI from "../../api/FileSystemAPI";
import ConsoleAPI from "../../api/ConsoleAPI";
import Engine from "../../Engine";

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
            MeshComponent.updateMap(this)
    }

    get meshID() {
        return this._meshID
    }

    set materialID(data) {
        console.trace(data, this)
        if (this._materialID === data)
            return
        this._materialID = data

        if (!data && typeof this.__mapSource.index === "number") {
            MaterialAPI[this.__mapSource.type].splice(this.__mapSource.index, 1)
            this.__mapSource = {}
        } else if (data)
            MeshComponent.updateMap(this)
    }

    static updateMap(component) {
        if (!Engine.queryMap.get(component.__entity.queryKey))
            return;
        const referenceMat = GPU.materials.get(component._materialID)
        const referenceMesh = GPU.meshes.get(component._meshID)

        if (referenceMat && referenceMesh) {
            if (component.__mapSource.material === referenceMat && component.__mapSource.mesh === referenceMesh)
                return
            if (typeof component.__mapSource.index !== "number" || !MaterialAPI[component.__mapSource.type]?.[component.__mapSource.index]) {
                let key
                switch (referenceMat.shadingType) {
                    case MATERIAL_RENDERING_TYPES.DEFERRED:
                        key = "deferredShadedEntities"
                        break
                    case MATERIAL_RENDERING_TYPES.FORWARD:
                    case MATERIAL_RENDERING_TYPES.UNLIT:
                        key = "forwardShadedEntities"
                        break
                    case MATERIAL_RENDERING_TYPES.SKYBOX:
                        key = "staticShadedEntities"
                        break
                }
                component.__mapSource.type = key
                MaterialAPI[key].push({
                    entity: component.__entity,
                    component: component,
                    mesh: referenceMesh,
                    material: referenceMat
                })
                component.__mapSource.index = MaterialAPI[key].length - 1
            } else {
                const current = MaterialAPI[component.__mapSource.type][component.__mapSource.index]
                current.material = referenceMat
                current.mesh = referenceMesh

            }
        }
        if (!referenceMat && component._materialID != null) {
            console.trace(component._materialID)
            FileSystemAPI.loadMaterial(component._materialID).then(res => {
                if (res)
                    MeshComponent.updateMap(component)
                else
                    ConsoleAPI.error("Material not found")
            })
        }
        if (!referenceMesh && component._meshID != null) {
            FileSystemAPI.loadMesh(component._meshID).then(res => {
                if (res)
                    MeshComponent.updateMap(component)
                else
                    ConsoleAPI.error("Mesh not found")
            })
        }
        console.log(component, MaterialAPI.deferredShadedEntities)
    }

    get materialID() {
        return this._materialID
    }

}