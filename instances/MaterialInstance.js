import TextureInstance from "./TextureInstance";
import ImageProcessor from "../../workers/image/ImageProcessor";
import MATERIAL_TYPES from "../templates/MATERIAL_TYPES";


export default class MaterialInstance {
    _ready = false
    _initializing = false
    uvScale = [1, 1]

    constructor(
        gpu,
        id,
        type,
        uvScale
    ) {
        this.id = id
        this.gpu = gpu
        this.parallaxEnabled = 0

        this.type = type

        if (uvScale !== undefined && Array.isArray(uvScale) && uvScale.length === 2)
            this.uvScale = uvScale
    }

    async initializeTextures(material, update) {

        const albedo = material?.albedo?.high ? material.albedo.high : await ImageProcessor.colorToImage('rgba(127, 127, 127, 1)', 32),
            metallic = material?.metallic?.high ? material.metallic.high :await  ImageProcessor.colorToImage('rgba(0, 0, 0, 1)', 32),
            roughness = material?.roughness?.high ? material.roughness.high : await ImageProcessor.colorToImage('rgba(255, 255, 255, 1)', 32),
            normal = material?.normal?.high ? material.normal.high :await  ImageProcessor.colorToImage('rgba(127, 127, 255, 1)', 32),
            height = material?.height?.high ? material.height.high : await ImageProcessor.colorToImage('rgba(127, 127, 127, 1)', 32),
            ao = material?.ao?.high ? material.ao.high : await ImageProcessor.colorToImage('rgba(255, 255, 255, 1)', 32),
            emissive = material?.emissive?.high ? material.emissive.high : await ImageProcessor.colorToImage('rgba(0, 0, 0, 1)', 32),
            opacity = material?.opacity?.high ? material.opacity.high : undefined,
            tiling = material?.tiling ? material.tiling : [1, 1]

        if (!this._initializing) {
            this.uvScale = tiling
            this._initializing = true

            if (typeof material?.heightMeta === 'object') {
                this.parallaxEnabled = 1
                this.parallaxHeightScale = material.heightMeta.heightScale
                this.parallaxLayers = material.heightMeta.layers

            }


            this.albedo = new TextureInstance(albedo, false, this.gpu, undefined, undefined, true)
            this.metallic = new TextureInstance(metallic, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true)
            this.roughness = new TextureInstance(roughness, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true)
            this.normal = new TextureInstance(normal, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true)
            this.height = new TextureInstance(height, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true)
            this.ao = new TextureInstance(ao, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true)
            this.emissive = new TextureInstance(emissive, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true)

            if (this.type === MATERIAL_TYPES.TRANSPARENT) {

                this.opacity = new TextureInstance(opacity ? opacity : await ImageProcessor.colorToImage('rgba(255, 255, 255, 1)'), false, this.gpu, this.gpu.RGB, this.gpu.RGB, true, false, undefined, undefined, undefined, true)
            }

            this._ready = true
        }
        if (update) {
            if (typeof material?.heightMeta === 'object') {
                this.parallaxEnabled = 1
                this.parallaxHeightScale = material.heightMeta.heightScale
                this.parallaxLayers = material.heightMeta.layers

            }
            this.albedo.update(albedo, this.gpu)
            this.metallic.update(metallic, this.gpu)
            this.roughness.update(roughness, this.gpu)
            this.normal.update(normal, this.gpu)
            this.height.update(height, this.gpu)
            this.ao.update(ao, this.gpu)
            this.emissive.update(emissive, this.gpu)
            if (this.type === MATERIAL_TYPES.TRANSPARENT)
                this.opacity.update(opacity, this.gpu)

        }
    }

    get ready() {
        return this._ready
    }
}
