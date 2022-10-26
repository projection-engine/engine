import {v4} from "uuid"
import MaterialAPI from "../api/rendering/MaterialAPI";

export default class MaterialInstance {
    id = v4()
    materialReference
    uniformData = {}
    settings = {}
    uniforms = {}
    ready = false
    texturesInUse = {}
    updateTexture = {}

    constructor(id, uniformData, materialReference, resolve) {
        this.materialReference = materialReference
        this.uniforms = materialReference.uniforms
        this.id = id
        this.settings = materialReference.settings

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
