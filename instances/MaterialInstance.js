import TextureInstance from "./TextureInstance";
import ImageProcessor from "../utils/image/ImageProcessor";
import ShaderInstance from "./ShaderInstance";
import {DATA_TYPES} from "../templates/DATA_TYPES";

export default class MaterialInstance {
    ready = false
    uniformData = {}
    uniforms = []

    settings = {}
    rsmAlbedo
    hasCubeMap = false

    constructor(gpu, vertexShader, shader, uniformData = [], settings = {}, onCompiled = () => null, id, cubeMapShaderCode) {
        this.gpu = gpu
        this.id = id
        this._initializeSettings(settings)

        this.shader = [shader, vertexShader, uniformData, onCompiled]
        if (cubeMapShaderCode !== undefined && cubeMapShaderCode !== null )
            this.cubeMapShader = [cubeMapShaderCode, vertexShader]
        else
            this.hasCubeMap = false
    }

    set cubeMapShader([shader, vertexShader]) {
        const v = shader !== undefined && shader !== null
        if(v) {
            this._cubeMapShader = new ShaderInstance(vertexShader, shader, this.gpu, m => null)
            this.hasCubeMap = v
        }
    }

    _initializeSettings(settings) {
        this.settings = settings
        if (settings.rsmAlbedo) {
            if (this.rsmAlbedo)
                this.gpu.deleteTexture(this.rsmAlbedo.texture)
            this.rsmAlbedo = new TextureInstance(
                settings.rsmAlbedo,
                false,
                this.gpu,
                this.gpu.SRGB8_ALPHA8,
                this.gpu.RGBA,
                true,
                false,
                this.gpu.UNSIGNED_BYTE,
                undefined,
                undefined,
                0,
                () => null
            )

            delete this.settings.rsmAlbedo
        }
    }

    set shader([shader, vertexShader, uniformData, onCompiled, settings]) {
        this.ready = false
        if (settings)
            this._initializeSettings(settings)
        let message
        if (this._shader)
            this.gpu.deleteProgram(this._shader.program)
        this._shader = new ShaderInstance(vertexShader, shader, this.gpu, m => message = m)

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
                                this.gpu,
                                this.gpu[k.format?.internalFormat],
                                this.gpu[k.format?.format],
                                true,
                                false,
                                this.gpu.UNSIGNED_BYTE,
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


}
