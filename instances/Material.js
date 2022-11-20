import {v4} from "uuid"
import MATERIAL_RENDERING_TYPES from "../static/MATERIAL_RENDERING_TYPES";
import MaterialAPI from "../lib/rendering/MaterialAPI";
import {DEFAULT_MATRICES} from "../static/SIMPLE_MATERIAL_UNIFORMS";
import GPUAPI from "../lib/rendering/GPUAPI";
import LightsAPI from "../lib/rendering/LightsAPI";

export default class Material {
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
    cullFace = "BACK"
    noDepthTest
    bindID

    static incrementalMap = new Map()
    static #generator

    static* getIncrementalID() {
        let counter = 1
        while (true) {
            yield counter
            counter++
        }
    }

    constructor({
                    vertex,
                    fragment,
                    uniformData,
                    settings,
                    id,
                    onCompiled,
                    cubeMapShaderCode
                }) {
        if (!Material.#generator)
            Material.#generator = Material.getIncrementalID()
        this.id = id ? id : v4().toString()
        this.bindID = Material.#generator.next().value

        Material.incrementalMap.set(this.bindID, this)

        this.settings = settings
        this.shader = [fragment, vertex, uniformData, onCompiled]
        if (!cubeMapShaderCode)
            this.hasCubeMap = false
        else
            this.cubeMapShader = [cubeMapShaderCode, vertex]

    }

    set settings(settings) {
        if (settings) {
            this.#settings = settings
            this.cullFace = settings.cullFace
            this.noDepthTest = settings.noDepthTest
            this.shadingType = settings.shadingType
            this.isForwardShaded = settings.shadingType === MATERIAL_RENDERING_TYPES.FORWARD || settings.shadingType === MATERIAL_RENDERING_TYPES.UNLIT
            this.isDeferredShaded = settings.shadingType === MATERIAL_RENDERING_TYPES.DEFERRED
        }
    }

    get settings() {
        return this.#settings
    }



    get shader() {
        return this._shader
    }

    set shader([shader, vertexShader, u, onCompiled, settings]) {
        const uniformData = [...DEFAULT_MATRICES]
        if (u)
            uniformData.push(...u)
        if (this.ready)
            this.delete()
        this.ready = false
        this.settings = settings
        let message

        GPUAPI.destroyShader(this.id)
        GPUAPI.destroyShader(this.id + "-CUBE-MAP")

        this._shader = GPUAPI.allocateShader(this.id, vertexShader, shader)

        if (this.shadingType === MATERIAL_RENDERING_TYPES.FORWARD) {
            LightsAPI.pointLightsUBO.bindWithShader(this._shader.program)
            LightsAPI.directionalLightsUBO.bindWithShader(this._shader.program)
        }
        MaterialAPI.updateMaterialUniforms(uniformData, this).then(() => {
            if (onCompiled)
                onCompiled(message)
            this.ready = true
            this.instances.forEach(matInstance => {
                matInstance.uniformData = this.uniformData
            })
        })
    }

    use(additionalUniforms = {}, isCubeMap = false, uniforms = this.uniformData) {
        const shader = this._shader

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
            Material.incrementalMap.delete(this.bindID)
        } catch (err) {
            console.error(err)
        }
    }
}
