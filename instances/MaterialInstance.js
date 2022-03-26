import TextureInstance from "./TextureInstance";
import ImageProcessor from "../../workers/ImageProcessor";
import MATERIAL_TYPES from "../utils/misc/MATERIAL_TYPES";


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

        const albedo = material?.albedo?.low ? material.albedo.low : ImageProcessor.colorToImage('rgba(127, 127, 127, 1)', 128),
            metallic = material?.metallic?.low ? material.metallic.low : ImageProcessor.colorToImage('rgba(0, 0, 0, 1)', 128),
            roughness = material?.roughness?.low ? material.roughness.low : ImageProcessor.colorToImage('rgba(255, 255, 255, 1)', 128),
            normal = material?.normal?.low ? material.normal.low : ImageProcessor.colorToImage('rgba(127, 127, 255, 1)', 128),
            height = material?.height?.low ? material.height.low : ImageProcessor.colorToImage('rgba(127, 127, 127, 1)', 128),
            ao = material?.ao?.low ? material.ao.low : ImageProcessor.colorToImage('rgba(255, 255, 255, 1)', 128),
            emissive = material?.emissive?.low ? material.emissive.low : ImageProcessor.colorToImage('rgba(0, 0, 0, 1)', 128),
            opacity = material?.opacity?.low ? material.opacity.low : undefined,
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

                this.opacity = new TextureInstance(opacity ? opacity : ImageProcessor.colorToImage('rgba(255, 255, 255, 1)'), false, this.gpu, this.gpu.RGB, this.gpu.RGB, true, false, undefined, undefined, undefined, true)
            }

            this._ready = true
        }
        if (update) {
            if (typeof material?.heightMeta === 'object') {
                this.parallaxEnabled = 1
                this.parallaxHeightScale = material.heightMeta.heightScale
                this.parallaxLayers = material.heightMeta.layers

            }
            console.log(albedo)
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
