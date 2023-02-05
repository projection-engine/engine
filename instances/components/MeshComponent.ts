import Component from "./Component"

import MESH_PROPS from "../../static/component-props/MESH_PROPS";
import MaterialAPI from "../../lib/rendering/MaterialAPI";
import ResourceEntityMapper from "../../resource-libs/ResourceEntityMapper";
import GPU from "../../GPU";
import FileSystemAPI from "../../lib/utils/FileSystemAPI";
import MeshResourceMapper from "../../lib/MeshResourceMapper";
import Entity from "../Entity";
import MaterialResourceMapper from "../../lib/MaterialResourceMapper";
import MaterialUniform from "../../static/MaterialUniform";

export default class MeshComponent extends Component {

    _props = MESH_PROPS

    castsShadows = true
    _meshID?: string
    _materialID?: string

    #texturesInUse = {}
    #mappedUniforms = {}
    #materialUniforms: MaterialUniform[] = []

    updateMaterialUniformValue(key: string, value: any) {
        this.#mappedUniforms[key] = value
    }

    get mappedUniforms() {
        return this.#mappedUniforms
    }

    contributeToProbes = true
    overrideMaterialUniforms = false

    updateComponentReferences() {
        if (this._meshID)
            this.#bindMesh(this._meshID)
        if (this._materialID)
            this.#bindMaterial(this._materialID)
    }

    #bindMesh(meshID: string) {
        if (!Entity.isRegistered(this.entity) || !meshID) return;
        const found = GPU.meshes.get(meshID)
        if (!found)
            FileSystemAPI.loadMesh(meshID).then(_ => {
                const found = GPU.meshes.get(meshID)
                if (!found) {
                    console.error("Mesh not found");
                    return
                }
                this.entity.meshRef = found
                MeshResourceMapper.linkEntityMesh(this.entity, meshID)

            })
        else {
            this.entity.meshRef = found
            MeshResourceMapper.linkEntityMesh(this.entity, meshID)
        }
    }

    set meshID(meshID) {
        this._meshID = meshID

        const entity = this.entity
        if (!Entity.isRegistered(entity)) return;

        if (meshID)
            this.#bindMesh(meshID)
        else {
            MeshResourceMapper.unlinkEntityMesh(this.entity.id)
            this.entity.meshRef = undefined
        }
    }

    get meshID() {
        return this._meshID
    }

    #bindMaterial(materialID: string) {
        if (!Entity.isRegistered(this.entity) || !materialID) return;
        const found = GPU.materials.get(materialID)
        if (!found)
            FileSystemAPI.loadMaterial(materialID).then(_ => {
                const found = GPU.materials.get(materialID)
                if (!found) {
                    console.error("Material not found");
                    return
                }
                this.entity.materialRef = found
                this.#materialUniforms = this.entity.materialRef.uniforms
                this.#mappedUniforms = {}
                MaterialAPI.mapUniforms(this.#materialUniforms, this.#texturesInUse, this.#mappedUniforms).catch()
                MaterialResourceMapper.linkEntityMaterial(this.entity, materialID)

            })
        else {
            this.entity.materialRef = found
            this.#materialUniforms = this.entity.materialRef.uniforms
            this.#mappedUniforms = {}
            MaterialAPI.mapUniforms(this.#materialUniforms, this.#texturesInUse, this.#mappedUniforms).catch()
            MaterialResourceMapper.linkEntityMaterial(this.entity, materialID)
        }
    }

    set materialID(materialID) {
        this._materialID = materialID
        const entity = this.entity
        if (!Entity.isRegistered(entity)) return;

        if (materialID)
            this.#bindMaterial(materialID)
        else {
            MaterialResourceMapper.unlinkEntityMaterial(this.entity.id)
            this.entity.materialRef = undefined
        }
    }

    get materialUniforms(): MaterialUniform[] {
        return this.#materialUniforms
    }

    get hasMesh(): boolean {
        return this._meshID !== undefined
    }

    get texturesInUse() {
        return this.#texturesInUse
    }

    get hasMaterial(): boolean {
        return this._materialID !== undefined
    }

    get materialID() {
        return this._materialID
    }

}