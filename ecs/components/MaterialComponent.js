import Component from "../basic/Component";
import Texture from "../../renderer/elements/Texture";
import {colorToImage} from "../../utils/imageManipulation";

export default class MaterialComponent extends Component {
    constructor(
        gpu,
        id,
        name,
        active,
        albedo = colorToImage('rgba(127, 127, 127, 1)'),
        metallic = colorToImage('rgba(0, 0, 0, 1)'),
        roughness = colorToImage('rgba(255, 255, 255, 1)'),
        normal = colorToImage('rgba(127, 127, 255, 1)'),
        height = colorToImage('rgba(255, 255, 255, 1)'),
        ao = colorToImage('rgba(255, 255, 255, 1)')
    ) {
        super(id, name, active);

        this.albedo = new Texture(albedo, false, gpu)
        this.metallic = new Texture(metallic, false, gpu, gpu.RGB, gpu.RGB)
        this.roughness = new Texture(roughness, false, gpu, gpu.RGB, gpu.RGB)
        this.height = new Texture(height, false, gpu, gpu.RGB, gpu.RGB)
        this.normal = new Texture(normal, false, gpu, gpu.RGB, gpu.RGB)
        this.ao = new Texture(ao, false, gpu, gpu.RGB, gpu.RGB)
    }
}