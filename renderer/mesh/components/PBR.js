import Texture from "./Texture";
import {colorToImage} from "../../../utils/imageManipulation";
import randomID from "../../../../components/shared/utils/randomID";

export default class PBR {
    constructor(
        gpu,
        albedo = colorToImage('rgba(127, 127, 127, 1)'),
        metallic = colorToImage('rgba(0, 0, 0, 1)'),
        roughness = colorToImage('rgba(255, 255, 255, 1)'),
        normal = colorToImage('rgba(127, 127, 255, 1)'),
        height = colorToImage('rgba(255, 255, 255, 1)'),
        ao = colorToImage('rgba(255, 255, 255, 1)'),
        id = randomID()
    ) {
        this.id = id
        this.albedo = new Texture(albedo, false, gpu)
        this.metallic = new Texture(metallic, false, gpu, gpu.RGB, gpu.RGB)
        this.roughness = new Texture(roughness, false, gpu, gpu.RGB, gpu.RGB)
        this.height = new Texture(height, false, gpu, gpu.RGB, gpu.RGB)
        this.normal = new Texture(normal, false, gpu, gpu.RGB, gpu.RGB)
        this.ao = new Texture(ao, false, gpu, gpu.RGB, gpu.RGB)
    }
}