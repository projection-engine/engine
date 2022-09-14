import {v4} from "uuid"
import MaterialAPI from "../apis/rendering/MaterialAPI";

export default class MaterialInstanceController {
    id = v4()
    materialReference
    uniformData = {}
    settings = {}
    uniforms = {}

    constructor(id, uniformData, materialReference, resolve) {
        this.materialReference = materialReference
        this.uniforms = materialReference.uniforms
        this.id = id
        this.settings = materialReference.settings
        MaterialAPI.updateMaterialUniforms(uniformData, this).then(() => {
            resolve(this)
        })
    }

    use(additionalUniforms = {}, isCubeMap = false) {
        this.materialReference.use(additionalUniforms, isCubeMap, this.uniformData)
    }
}
