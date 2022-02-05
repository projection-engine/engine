import Texture from "../../renderer/elements/Texture";
import ImageProcessor from "../../../workers/ImageProcessor";

export default class MaterialInstance {
    constructor(
        gpu,
        id,
        albedo = ImageProcessor.colorToImage('rgba(127, 127, 127, 1)'),
        metallic = ImageProcessor.colorToImage('rgba(0, 0, 0, 1)'),
        roughness = ImageProcessor.colorToImage('rgba(255, 255, 255, 1)'),
        normal = ImageProcessor.colorToImage('rgba(127, 127, 255, 1)'),
        height = ImageProcessor.colorToImage('rgba(255, 255, 255, 1)'),
        ao = ImageProcessor.colorToImage('rgba(255, 255, 255, 1)'),
        autoInit = true
    ) {
        this.id = id
        if(autoInit){
            this.albedo = new Texture(albedo, false, gpu)
            this.metallic = new Texture(metallic, false, gpu, gpu.RGB, gpu.RGB)
            this.roughness = new Texture(roughness, false, gpu, gpu.RGB, gpu.RGB)
            this.normal = new Texture(normal, false, gpu, gpu.RGB, gpu.RGB)
            this.height = new Texture(height, false, gpu, gpu.RGB, gpu.RGB)
            this.ao = new Texture(ao, false, gpu, gpu.RGB, gpu.RGB)
        }
    }
}