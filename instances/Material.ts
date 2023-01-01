import {v4} from "uuid"
import MaterialAPI from "../lib/rendering/MaterialAPI";
import MaterialUniform from "../templates/MaterialUniform";
import TextureInUse from "../templates/TextureInUse";
import MutableObject from "../MutableObject";


export default class Material {
    readonly #id = crypto.randomUUID()
    #uniformValues: MutableObject = {}
    #uniforms = []
    #functionDeclaration?: string
    #uniformsDeclaration?: string
    texturesInUse: TextureInUse = {}
    isAlphaTested = false
    ssrEnabled = false
    isSky = false
    doubleSided = false
    bindID = -1

    constructor(id?: string) {
        if (!id)
            return
        this.#id = id
    }

    get id(): string {
        return this.#id
    }

    get uniforms(): MaterialUniform[] {
        return this.#uniforms
    }

    get uniformValues(): MutableObject {
        return this.#uniformValues
    }

    get functionDeclaration(): string | undefined {
        return this.#functionDeclaration
    }

    get uniformsDeclaration(): string | undefined {
        return this.#uniformsDeclaration
    }

    updateMaterialDeclaration(functionDeclaration, uniforms) {
        this.#functionDeclaration = functionDeclaration
        this.#uniformsDeclaration = uniforms
    }

    async updateUniformGroup(uniforms: MaterialUniform[]) {
        if (!uniforms)
            return;
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
