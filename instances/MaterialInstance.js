import TextureInstance from "./TextureInstance";
import ImageProcessor from "../../workers/ImageProcessor";
import MATERIAL_TYPES from "../utils/misc/MATERIAL_TYPES";

export default class MaterialInstance {
    _ready = false
    _initializing = false
    constructor(
        gpu,
        id,
        parallax = 0,
        heightScale = 0,
        parallaxLayers = 0,
        type
    ) {
        this.id = id
        this.gpu = gpu
        this.parallaxEnabled = parallax
        this.parallaxHeightScale = heightScale
        this.parallaxLayers = parallaxLayers

        this.type = type
    }

    async initializeTextures(
        albedo = ImageProcessor.colorToImage('rgba(127, 127, 127, 1)'),
        metallic = ImageProcessor.colorToImage('rgba(0, 0, 0, 1)'),
        roughness = ImageProcessor.colorToImage('rgba(255, 255, 255, 1)'),
        normal = ImageProcessor.colorToImage('rgba(127, 127, 255, 1)'),
        height = ImageProcessor.colorToImage('rgba(127, 127, 127, 1)'),
        ao = ImageProcessor.colorToImage('rgba(255, 255, 255, 1)'),
        emissive = ImageProcessor.colorToImage('rgba(0, 0, 0, 1)'),
        opacity,
        subSurface

    ) {

        if(!this._initializing) {
            this._initializing = true
            let heightToApply = height
            const asPOM = typeof height === "object"
            if (asPOM) {
                this.parallaxEnabled = 1
                this.parallaxHeightScale = height.heightScale
                this.parallaxLayers = height.layers
                heightToApply = height.image
            }


            const sharedImg = new Image()


            let texture = await base64ToBuffer(albedo, sharedImg)
            this.albedo = new TextureInstance(texture.data, false, this.gpu, ...[, ,], true, false, undefined, texture.width, texture.height)

            texture = await base64ToBuffer(metallic, sharedImg)
            this.metallic = new TextureInstance(texture.data, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true, false, undefined, texture.width, texture.height)

            texture = await base64ToBuffer(roughness, sharedImg)
            this.roughness = new TextureInstance(texture.data, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true, false, undefined, texture.width, texture.height)

            texture = await base64ToBuffer(normal, sharedImg)
            this.normal = new TextureInstance(texture.data, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true, false, undefined, texture.width, texture.height)

            texture = await base64ToBuffer(heightToApply, sharedImg)
            this.height = new TextureInstance(texture.data, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true, false, undefined, texture.width, texture.height)

            texture = await base64ToBuffer(ao, sharedImg)
            this.ao = new TextureInstance(texture.data, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true, false, undefined, texture.width, texture.height)

            texture = await base64ToBuffer(emissive, sharedImg)
            this.emissive = new TextureInstance(texture.data, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true, false, undefined, texture.width, texture.height)

            if(this.type === MATERIAL_TYPES.TRANSPARENT){
                texture = await base64ToBuffer(opacity ? opacity : ImageProcessor.colorToImage('rgba(255, 255, 255, 1)'), sharedImg)
                this.opacity = new TextureInstance(texture.data, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true, false, undefined, texture.width, texture.height)
            }

            this._ready = true
        }
    }

    get ready() {
        return this._ready
    }
}

async function base64ToBuffer(b64Data, img) {
    const p = new Promise(resolve => {
        img.onload = () => {
            resolve({
                data: img,
                width: img.naturalWidth,
                height: img.naturalHeight
            })
        }
        img.src = b64Data
    })

    return await p
}