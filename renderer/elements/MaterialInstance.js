import Texture from "../../renderer/elements/Texture";
import ImageProcessor from "../../../workers/ImageProcessor";
import getImagePromise from "../../utils/getImagePromise";

export default class MaterialInstance {
    _ready = false
    constructor(
        gpu,
        id,
        parallax=1,
        heightScale=.1,
        parallaxLayers=64
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
        height = ImageProcessor.colorToImage('rgba(255, 255, 255, 1)'),
        ao = ImageProcessor.colorToImage('rgba(255, 255, 255, 1)')
    ) {
        let imagesToLoad = [
            await getImagePromise(albedo, 'albedo'),
            await getImagePromise(metallic, 'metallic'),
            await getImagePromise(roughness, 'roughness'),
            await getImagePromise(normal, 'normal'),
            await getImagePromise(height, 'height'),
            await getImagePromise(ao, 'ao')
        ]
        this.albedo = new Texture(imagesToLoad[0].data, false, this.gpu, ...[, ,], true)
        this.metallic = new Texture(imagesToLoad[1].data, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true)
        this.roughness = new Texture(imagesToLoad[2].data, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true)
        this.normal = new Texture(imagesToLoad[3].data, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true)
        this.height = new Texture(imagesToLoad[4].data, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true)
        this.ao = new Texture(imagesToLoad[5].data, false, this.gpu, this.gpu.RGB, this.gpu.RGB, true)

        this._ready = true
    }
    get ready(){
        return this._ready
    }
}