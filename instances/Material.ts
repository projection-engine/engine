import {v4} from "uuid"
import MaterialAPI from "../lib/rendering/MaterialAPI";
// @ts-ignore
import VERTEX_SHADER from "../shaders/uber-shader/UBER-MATERIAL.vert"
// @ts-ignore
import BASIS_FRAG from "../shaders/uber-shader/UBER-MATERIAL-BASIS.frag"
// @ts-ignore
import DEBUG_FRAG from "../shaders/uber-shader/UBER-MATERIAL-DEBUG.frag"
import MaterialUniform from "../templates/MaterialUniform";
import TextureInUse from "../templates/TextureInUse";
import MutableObject from "../MutableObject";


export default class Material {
    #id = ""
    #uniformValues:MutableObject = {}
    #uniforms = []
    #functionDeclaration?:string
    #uniformsDeclaration?:string
    texturesInUse:TextureInUse = {}
    isAlphaTested = false
    ssrEnabled = false
    isSky = false
    doubleSided = false

    bindID = -1

    constructor(id) {
        this.#id = id ? id : v4()
    }

    get id():string {
        return this.#id
    }

    get uniforms():MaterialUniform[] {
        return this.#uniforms
    }

    get uniformValues():MutableObject {
        return this.#uniformValues
    }

    get functionDeclaration():string|undefined {
        return this.#functionDeclaration
    }

    get uniformsDeclaration():string|undefined {
        return this.#uniformsDeclaration
    }

    updateMaterialDeclaration(functionDeclaration, uniforms) {
        this.#functionDeclaration = functionDeclaration
        this.#uniformsDeclaration = uniforms
    }

    async updateUniformGroup(uniforms:MaterialUniform[]) {
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
