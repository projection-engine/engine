import Component from "../basic/Component";
import Texture from "../../renderer/elements/Texture";
import {colorToImage} from "../../utils/imageManipulation";

export default class MaterialComponent extends Component {
    materialID
    constructor(
        id,
        name='Empty material',
        active,
        materialID
    ) {
        super(id, name, active);
        this.materialID = materialID
    }
}