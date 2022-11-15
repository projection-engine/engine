import {v4} from "uuid"
import MaterialAPI from "../lib/rendering/MaterialAPI";

export default class MaterialInstance {
    id = v4()
    materialReference
    uniformData = {}
    settings = {}
    uniforms = {}
    ready = false
    texturesInUse = {}
    updateTexture = {}
    refID
    shader
    constructor(id, uniformData, materialReference, resolve) {
        this.materialReference = materialReference
        this.uniforms = materialReference.uniforms
        this.id = id
        this.refID = materialReference.id
        this.settings = materialReference.settings
        this.shader = this.materialReference._shader
        MaterialAPI.updateMaterialUniforms(uniformData, this).then(() => {
            resolve(this)
            this.ready = true
            this.shadingType = this.materialReference.shadingType
            this.isForwardShaded = this.materialReference.isForwardShaded
            this.isDeferredShaded = this.materialReference.isDeferredShaded
        })
    }

    use(additionalUniforms = {}, isCubeMap = false) {
        this.materialReference.use(additionalUniforms, isCubeMap, this.uniformData)
    }
}
