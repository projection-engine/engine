import Texture from "../../renderer/elements/Texture";
import ImageProcessor from "../../../workers/ImageProcessor";

export default class MaterialInstance {
    _ready = false

    constructor(
        gpu,
        id,
        parallax = 0,
        heightScale = 0,
        parallaxLayers = 0
    ) {
        this.id = id
        this.gpu = gpu
        this.parallaxEnabled = parallax
        this.parallaxHeightScale = heightScale
        this.parallaxLayers = parallaxLayers
    }

    async initializeTextures(
        albedo = ImageProcessor.colorToImage('rgba(127, 127, 127, 1)'),
        metallic = ImageProcessor.colorToImage('rgba(0, 0, 0, 1)'),
        roughness = ImageProcessor.colorToImage('rgba(255, 255, 255, 1)'),
        normal = ImageProcessor.colorToImage('rgba(127, 127, 255, 1)'),
        height = ImageProcessor.colorToImage('rgba(127, 127, 127, 1)'),
        ao = ImageProcessor.colorToImage('rgba(255, 255, 255, 1)')
    ) {
        let heightToApply = height
        const asPOM = typeof height === "object"
        if (asPOM) {
            this.parallaxEnabled = 1
            this.parallaxHeightScale = height.heightScale
            this.parallaxLayers = height.layers
            heightToApply = height.image
        }

        const imagesToLoad = [
            await base64ToBuffer(albedo),
            await base64ToBuffer(metallic),
            await base64ToBuffer(roughness),
            await base64ToBuffer(normal),
            await base64ToBuffer(heightToApply),
            await base64ToBuffer(ao)
        ]


        this.albedo = new Texture(imagesToLoad[0].data, false, this.gpu, ...[, ,], true, false, undefined, imagesToLoad[0].width,  imagesToLoad[0].height)
        this.metallic = new Texture(imagesToLoad[1].data, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true, false, undefined, imagesToLoad[0].width,  imagesToLoad[0].height)
        this.roughness = new Texture(imagesToLoad[2].data, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true, false, undefined, imagesToLoad[0].width,  imagesToLoad[0].height)
        this.normal = new Texture(imagesToLoad[3].data, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true, false, undefined, imagesToLoad[0].width,  imagesToLoad[0].height)
        this.height = new Texture(imagesToLoad[4].data, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true, false, undefined, imagesToLoad[0].width,  imagesToLoad[0].height)
        this.ao = new Texture(imagesToLoad[5].data, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true, false, undefined, imagesToLoad[0].width,  imagesToLoad[0].height)

        this._ready = true
    }

    get ready() {
        return this._ready
    }
}

async function base64ToBuffer(b64Data) {
    // let base64Index = b64Data.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    // let base64 = b64Data.substring(base64Index);
    // const byteCharacters = atob(base64);
    // const byteArrays = [];
    //
    // for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    //     const slice = byteCharacters.slice(offset, offset + 512);
    //
    //     const byteNumbers = new Array(slice.length);
    //     for (let i = 0; i < slice.length; i++) {
    //         byteNumbers[i] = slice.charCodeAt(i);
    //     }
    //
    //     const byteArray = new Uint8Array(byteNumbers);
    //     byteArrays.push(byteArray);
    // }
    //
    // const blob = new Blob(byteArrays, {type: 'image/png'});
    //
    // return await createImageBitmap(blob)

    const p = new Promise(resolve =>{
        const img = new Image()
        img.onload = () => {
            resolve({
                data: img,
                width: img.naturalWidth,
                height: img.naturalHeight
            })
        }
        img.src= b64Data
    })

    return await p
}