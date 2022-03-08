import TextureInstance from "./TextureInstance";
import ImageProcessor from "../../../workers/ImageProcessor";

export default class TerrainMaterialInstance {
    _ready = false
    _initializing = false
    constructor(
        gpu,
        id
    ) {
        this.id = id
        this.gpu = gpu

    }

    async initializeTextures(
        albedo = [ImageProcessor.colorToImage('rgba(127, 127, 127, 1)')],
        metallic = [ImageProcessor.colorToImage('rgba(0, 0, 0, 1)')],
        roughness = [ImageProcessor.colorToImage('rgba(255, 255, 255, 1)')],
        normal = [ImageProcessor.colorToImage('rgba(127, 127, 255, 1)')]
    ) {

        if(!this._initializing) {
            this._initializing = true
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