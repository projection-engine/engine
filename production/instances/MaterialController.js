import {v4} from "uuid"
import MATERIAL_RENDERING_TYPES from "../../static/MATERIAL_RENDERING_TYPES";
import GPU from "../GPU";
import MaterialAPI from "../apis/rendering/MaterialAPI";

export default class MaterialController {
    ready = false
    uniformData = {}
    uniforms = []
    #settings = {}
    hasCubeMap = false
    shadingType = MATERIAL_RENDERING_TYPES.DEFERRED
    isForwardShaded = false
    isDeferredShaded = true
    texturesInUse = {}
    updateTexture = {}
    instances = new Map()

    constructor({
                    vertex,
                    fragment,
                    uniformData,
                    settings,
                    id,
                    onCompiled,
                    cubeMapShaderCode
                }) {

        this.id = id ? id : v4().toString()
        this.settings = settings
        this.shader = [fragment, vertex, uniformData, onCompiled]
        if (cubeMapShaderCode !== undefined && cubeMapShaderCode !== null)
            this.cubeMapShader = [cubeMapShaderCode, vertex]
        else
            this.hasCubeMap = false
    }

    set settings(settings) {
        if (settings) {
            this.#settings = settings
            this.shadingType = settings.shadingType
            this.isForwardShaded = settings.shadingType === MATERIAL_RENDERING_TYPES.FORWARD || settings.shadingType === MATERIAL_RENDERING_TYPES.UNLIT
            this.isDeferredShaded = settings.shadingType === MATERIAL_RENDERING_TYPES.DEFERRED
        }
    }

    get settings() {
        return this.#settings
    }

    set cubeMapShader([shader, vertexShader]) {
        const v = shader !== undefined && shader !== null
        if (v) {
            this._cubeMapShader = GPU.allocateShader(this.id + "-CUBE-MAP", vertexShader, shader)
            this.hasCubeMap = v
        }
    }

    set shader([shader, vertexShader, uniformData, onCompiled, settings]) {
        if (this.ready)
            this.delete()
        this.ready = false
        this.settings = settings
        let message

        GPU.destroyShader(this.id)
        GPU.destroyShader(this.id + "-CUBE-MAP")

        this._shader = GPU.allocateShader(this.id, vertexShader, shader)
        if (uniformData) {
            MaterialAPI.updateMaterialUniforms(uniformData, this).then(() => {
                if (onCompiled)
                    onCompiled(message)
                this.ready = true
                this.instances.forEach(matInstance=> {
                    matInstance.uniformData = this.uniformData
                })
            })

        }
        else {
            this.uniformData = {}
            if (onCompiled)
                onCompiled()
            this.ready = true
        }
    }

    use(additionalUniforms = {}, isCubeMap = false, uniforms = this.uniformData) {
        const shader = isCubeMap ? this._cubeMapShader : this._shader
        if (shader) {
            Object.assign(uniforms, additionalUniforms)
            shader.bindForUse(uniforms)
        }
    }

    delete() {
        try {
            gpu.deleteProgram(this._shader.program)
            Object.values(this.uniformData).map(d => {
                if (d instanceof WebGLTexture)
                    gpu.deleteTexture(d)
            })
            Object.values(this.texturesInUse).forEach(t => {
                if (t && t.texture instanceof WebGLTexture)
                    gpu.deleteTexture(t.texture)
            })
            this.texturesInUse = {}
        } catch (err) {
            console.error(err)
        }
    }
}