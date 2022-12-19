import {v4} from "uuid"
import MaterialAPI from "../lib/rendering/MaterialAPI";
// @ts-ignore
import VERTEX_SHADER from "../shaders/uber-shader/UBER-MATERIAL.vert"
// @ts-ignore
import BASIS_FRAG from "../shaders/uber-shader/UBER-MATERIAL-BASIS.frag"
// @ts-ignore
import DEBUG_FRAG from "../shaders/uber-shader/UBER-MATERIAL-DEBUG.frag"

export default class Material {
    #id = ""
    #uniformValues = {}
    #uniforms = []
    #functionDeclaration
    #uniformsDeclaration
    texturesInUse = {}
    isAlphaTested = false
    ssrEnabled = false
    isSky = false
    doubleSided = false

    bindID = -1

    constructor(id) {
        this.#id = id ? id : v4()
    }

    get id() {
        return this.#id
    }


    get uniforms() {
        return this.#uniforms
    }

    get uniformValues() {
        return this.#uniformValues
    }

    get functionDeclaration() {
        return this.#functionDeclaration
    }

    get uniformsDeclaration() {
        return this.#uniformsDeclaration
    }

    updateMaterialDeclaration(functionDeclaration, uniforms) {
        this.#functionDeclaration = functionDeclaration
        this.#uniformsDeclaration = uniforms
    }

    async updateUniformGroup(uniforms) {
        this.#uniforms = uniforms
        await MaterialAPI.updateMaterialUniforms(this)
    }

    async updateUniformAttribute(key, data) {
        const ind = this.#uniforms.findIndex(d => d.key === key)
        if (ind === -1)
            return false
        try {
            if (this.#uniforms[ind]) {
                this.#uniforms[ind] = data
                await MaterialAPI.updateMaterialUniforms(this)
                return true
            }
        } catch (err) {
            console.error(err)
        }
        return false
    }
}
