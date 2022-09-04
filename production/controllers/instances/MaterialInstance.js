import DATA_TYPES from "../../data/DATA_TYPES"
import {v4} from "uuid"
import IMAGE_WORKER_ACTIONS from "../../data/IMAGE_WORKER_ACTIONS"
import MATERIAL_RENDERING_TYPES from "../../data/MATERIAL_RENDERING_TYPES";
import GPU from "../GPU";

export default class MaterialInstance {
    ready = false
    uniformData = {}
    uniforms = []
    #settings = {}
    hasCubeMap = false
    shadingType = MATERIAL_RENDERING_TYPES.DEFERRED
    isForwardShaded = false
    isDeferredShaded = true
    texturesInUse = {}

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
            console.log(this.isForwardShaded, this.shadingType)
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
        this.ready = false
        this.settings = settings
        let message

        GPU.destroyShader(this.id)
        GPU.destroyShader(this.id + "-CUBE-MAP")

        this._shader = GPU.allocateShader(this.id, vertexShader, shader)

        if (uniformData)
            Promise.all(uniformData.map(k => {
                return new Promise(async resolve => {
                    switch (k.type) {
                        case DATA_TYPES.COLOR:
                        case DATA_TYPES.TEXTURE: {
                            const img = k.type === DATA_TYPES.TEXTURE ? k.data : (await GPU.imageWorker(IMAGE_WORKER_ACTIONS.COLOR_TO_IMAGE, {
                                color: k.data,
                                resolution: 16
                            }))
                            const textureID = v4()
                            let texture = await GPU.allocateTexture({
                                img,
                                yFlip: k.yFlip,
                                internalFormat: gpu[k.format?.internalFormat],
                                format: gpu[k.format?.format],
                                repeat: true,
                                noMipMapping: false,
                                type: gpu.UNSIGNED_BYTE,
                                border: 0
                            }, textureID)
                            this.texturesInUse[textureID] = texture

                            this.uniformData[k.key] = texture.texture
                            break
                        }
                        default:
                            this.uniformData[k.key] = k.data
                            break
                    }
                    resolve()
                })
            })).then(() => {
                if (onCompiled)
                    onCompiled(message)
                this.ready = true
            })
        else
            this.ready = true
    }

    use(additionalUniforms = {}, isCubeMap = false) {
        const shader = isCubeMap ? this._cubeMapShader : this._shader
        if (shader) {
            const data = {...this.uniformData, ...additionalUniforms}
            shader.bindForUse(data)
        }
    }

    delete() {
        gpu.deleteProgram(this._shader.program)
        Object.values(this.uniformData).map(d => {
            if (d instanceof WebGLTexture)
                gpu.deleteTexture(d)
        })
        this.texturesInUse.values().forEach(t => {
            if (t.texture instanceof WebGLTexture)
                gpu.deleteTexture(t.texture)
        })
    }
}