import TextureInstance from "./TextureInstance"
import ImageProcessor from "../utils/image/ImageProcessor"
import ShaderInstance from "./ShaderInstance"
import {DATA_TYPES} from "../templates/DATA_TYPES"
import {v4} from "uuid"

export default class MaterialInstance {
    ready = false
    uniformData = {}
    uniforms = []

    settings = {}
    rsmAlbedo
    hasCubeMap = false

    constructor({
        vertex,
        fragment,
        uniformData,
        settings,
        id,
        onCompiled,
        cubeMapShaderCode
    } ) {
        this.id = id ? id : v4().toString()
        if (settings)
            this.settings = settings
        this.shader = [fragment, vertex, uniformData, onCompiled]
        if (cubeMapShaderCode !== undefined && cubeMapShaderCode !== null )
            this.cubeMapShader = [cubeMapShaderCode, vertex]
        else
            this.hasCubeMap = false
    }

    set cubeMapShader([shader, vertexShader]) {
        const v = shader !== undefined && shader !== null
        if(v) {
            this._cubeMapShader = new ShaderInstance(vertexShader, shader)
            this.hasCubeMap = v
        }
    }



    set shader([shader, vertexShader, uniformData, onCompiled, settings]) {
        this.ready = false
        if (settings)
            this.settings = settings
        let message
        if (this._shader)
            window.gpu.deleteProgram(this._shader.program)
        this._shader = new ShaderInstance(vertexShader, shader)
        
        if(uniformData)
            Promise.all(uniformData.map(k => {
                return new Promise(async resolve => {
                    switch (k.type) {
                    case DATA_TYPES.COLOR:
                    case DATA_TYPES.TEXTURE:
                        const img = k.type === DATA_TYPES.TEXTURE ? k.data : await ImageProcessor.colorToImage(k.data, 32)
                        let texture
                        await new Promise(r => {
                            texture = new TextureInstance(
                                img,
                                k.yFlip,
                                window.gpu[k.format?.internalFormat],
                                window.gpu[k.format?.format],
                                true,
                                false,
                                window.gpu.UNSIGNED_BYTE,
                                undefined,
                                undefined,
                                0,
                                () => {
                                    r()
                                }
                            )
                        })
                        this.uniformData[k.key] = texture.texture
                        break
                    default:
                        this.uniformData[k.key] = k.data
                        break
                    }
                    resolve()
                })
            }))
                .then(() => {
                    if (onCompiled)
                        onCompiled(message)
                    this.ready = true
                })
        else
            this.ready = true
    }

    use(bind = true, additionalUniforms = {}, isCubeMap = false) {
        const shader = isCubeMap ? this._cubeMapShader : this._shader
        if(shader) {
            if (bind)
                shader.use()
            const data = {...this.uniformData, ...additionalUniforms}
            shader.bindForUse(data)
        }
    }
    delete(){
        window.gpu.deleteProgram(this._shader.program)
        Object.values(this.uniformData).map(d => {
            if(d instanceof WebGLTexture)
                window.gpu.deleteTexture(d)
        })
    }
}
