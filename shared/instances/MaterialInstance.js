import TextureInstance from "./TextureInstance";
import ImageProcessor from "../../utils/image/ImageProcessor";
import Shader from "../utils/workers/Shader";
import {vertex} from "../shaders/mesh/meshDeferred.glsl";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";


export default class MaterialInstance {
    ready = false
    uvScale = [1, 1]
    uniformData = {}
    uniforms = []

    // {key, data, type}
    constructor(gpu, shader, uniformData = [], onCompiled = () => null, id) {
        this.gpu = gpu
        this.id = id

        this.shader = [shader, uniformData, onCompiled]
    }

    set shader([shader, uniformData, onCompiled]) {
        this.ready = false
        Promise.all(uniformData.map(k => {
            return new Promise(async resolve => {
                switch (k.type) {
                    case DATA_TYPES.COLOR:
                    case DATA_TYPES.TEXTURE:
                        const img = k.type === DATA_TYPES.TEXTURE ? k.data: await ImageProcessor.colorToImage(k.data, 32)
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
                    onCompiled()
                this.ready = true
            })

        if (this._shader)
            this.gpu.deleteProgram(this._shader.program)

        this._shader = new Shader(vertex, shader, this.gpu, true)
    }

    use(bind = true, additionalUniforms = {}) {

        if (bind)
            this._shader.use()
        const data = {...this.uniformData, ...additionalUniforms}
        this._shader.bindForUse(data)
    }

    async initializeTextures(material, update) {
        //
        // const albedo = material?.albedo?.high ? material.albedo.high : await ImageProcessor.colorToImage('rgba(127, 127, 127, 1)', 32),
        //     metallic = material?.metallic?.high ? material.metallic.high : await ImageProcessor.colorToImage('rgba(0, 0, 0, 1)', 32),
        //     roughness = material?.roughness?.high ? material.roughness.high : await ImageProcessor.colorToImage('rgba(255, 255, 255, 1)', 32),
        //     normal = material?.normal?.high ? material.normal.high : await ImageProcessor.colorToImage('rgba(127, 127, 255, 1)', 32),
        //     height = material?.height?.high ? material.height.high : await ImageProcessor.colorToImage('rgba(127, 127, 127, 1)', 32),
        //     ao = material?.ao?.high ? material.ao.high : await ImageProcessor.colorToImage('rgba(255, 255, 255, 1)', 32),
        //     emissive = material?.emissive?.high ? material.emissive.high : await ImageProcessor.colorToImage('rgba(0, 0, 0, 1)', 32),
        //     opacity = material?.opacity?.high ? material.opacity.high : undefined,
        //     tiling = material?.tiling ? material.tiling : [1, 1]
        //
        // if (!this._initializing) {
        //     this.uvScale = tiling
        //     this._initializing = true
        //
        //     if (typeof material?.heightMeta === 'object') {
        //         this.parallaxEnabled = 1
        //         this.parallaxHeightScale = material.heightMeta.heightScale
        //         this.parallaxLayers = material.heightMeta.layers
        //
        //     }
        //
        //
        //     this.albedo = new TextureInstance(albedo, false, this.gpu, undefined, undefined, true)
        //     this.metallic = new TextureInstance(metallic, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true)
        //     this.roughness = new TextureInstance(roughness, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true)
        //     this.normal = new TextureInstance(normal, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true)
        //     this.height = new TextureInstance(height, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true)
        //     this.ao = new TextureInstance(ao, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true)
        //     this.emissive = new TextureInstance(emissive, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true)
        //
        //     if (this.type === MATERIAL_TYPES.TRANSPARENT) {
        //
        //         this.opacity = new TextureInstance(opacity ? opacity : await ImageProcessor.colorToImage('rgba(255, 255, 255, 1)'), false, this.gpu, this.gpu.RGB, this.gpu.RGB, true, false, undefined, undefined, undefined, true)
        //     }
        //
        //     this.ready = true
        // }
        // if (update) {
        //     if (typeof material?.heightMeta === 'object') {
        //         this.parallaxEnabled = 1
        //         this.parallaxHeightScale = material.heightMeta.heightScale
        //         this.parallaxLayers = material.heightMeta.layers
        //
        //     }
        //     this.albedo.update(albedo, this.gpu)
        //     this.metallic.update(metallic, this.gpu)
        //     this.roughness.update(roughness, this.gpu)
        //     this.normal.update(normal, this.gpu)
        //     this.height.update(height, this.gpu)
        //     this.ao.update(ao, this.gpu)
        //     this.emissive.update(emissive, this.gpu)
        //     if (this.type === MATERIAL_TYPES.TRANSPARENT)
        //         this.opacity.update(opacity, this.gpu)
        //
        // }
    }


}
