import Texture from "../../renderer/elements/Texture";
import ImageProcessor from "../../../workers/ImageProcessor";

export default class MaterialInstance {
    constructor(
        gpu,
        id,
        albedo = ImageProcessor.colorToImage('rgba(127, 127, 127, 1)'),
        metallic = ImageProcessor.colorToImage('rgba(255, 255, 255, 1)'),
        roughness = ImageProcessor.colorToImage('rgba(127, 127, 127, 1)'),
        normal = ImageProcessor.colorToImage('rgba(127, 127, 255, 1)'),
        height = ImageProcessor.colorToImage('rgba(255, 255, 255, 1)'),
        ao = ImageProcessor.colorToImage('rgba(255, 255, 255, 1)')
    ) {
        this.id = id
        if (albedo)
            this.albedo = typeof albedo === "object" ? albedo : new Texture(albedo, false, gpu, ...[, ,], true)
        if (metallic)
            this.metallic =  typeof metallic === "object" ? metallic :new Texture(metallic, false, gpu, gpu.RGB, gpu.RGB, true)
        if (roughness)
            this.roughness = typeof roughness === "object" ? roughness : new Texture(roughness, false, gpu, gpu.RGB, gpu.RGB, true)
        if (normal)
            this.normal =  typeof normal === "object" ? normal :new Texture(normal, false, gpu, gpu.RGB, gpu.RGB, true)
        if (height)
            this.height =  typeof height === "object" ? height :new Texture(height, false, gpu, gpu.RGB, gpu.RGB, true)
        if (ao)
            this.ao = typeof ao === "object" ? ao : new Texture(ao, false, gpu, gpu.RGB, gpu.RGB, true)
    }
}