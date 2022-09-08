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
    updateTexture = {}

    static readAsset

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

        if (uniformData)
            Promise.all(uniformData.map(k => {
                return new Promise(async resolve => {
                    switch (k.type) {
                        case DATA_TYPES.COLOR: {
                            const img = await GPU.imageWorker(IMAGE_WORKER_ACTIONS.COLOR_TO_IMAGE, {
                                color: k.data,
                                resolution: 4
                            })
                            const textureID = k.data.toString()
                            let texture = await GPU.allocateTexture(img, textureID)
                            this.texturesInUse[textureID] = texture
                            this.updateTexture[textureID] = (newTexture) => {
                                this.uniformData[k.key] = newTexture
                            }
                            this.uniformData[k.key] = texture.texture
                            break
                        }
                        case DATA_TYPES.TEXTURE: {
                            try {
                                if (MaterialInstance.readAsset) {
                                    const textureID = k.data
                                    const asset = await MaterialInstance.readAsset(textureID)
                                    if (asset) {
                                        if(GPU.textures.get(textureID))
                                            GPU.destroyTexture(textureID)
                                        const textureData = typeof asset === "string" ? JSON.parse(asset) : asset
                                        console.log(textureData, asset)
                                        let texture = await GPU.allocateTexture({
                                            ...textureData,
                                            img: textureData.base64,
                                            yFlip: textureData.flipY,
                                        }, textureID)
                                        console.log(texture, textureID, textureData, asset)

                                        if(texture) {
                                            this.texturesInUse[textureID] = texture
                                            this.updateTexture[textureID] = (newTexture) => {
                                                this.uniformData[k.key] = newTexture
                                            }
                                            this.uniformData[k.key] = texture.texture
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error(error)
                            }
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
        else {
            if (onCompiled)
                onCompiled()
            this.ready = true
        }
    }

    use(additionalUniforms = {}, isCubeMap = false) {
        const shader = isCubeMap ? this._cubeMapShader : this._shader
        if (shader) {
            const data = {...this.uniformData, ...additionalUniforms}
            shader.bindForUse(data)
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

    static async parseMaterialObject({cubeMapShader, shader, vertexShader, uniforms, uniformData, settings}, id) {
        let newMat
        await new Promise(resolve => {
            newMat = GPU.allocateMaterial({
                vertex: vertexShader,
                fragment: shader,
                cubeMapShaderCode: cubeMapShader?.code,
                onCompiled: () => resolve(),
                settings,
                uniformData
            }, id)
        })
        newMat.uniforms = uniforms
        return newMat

    }
}
