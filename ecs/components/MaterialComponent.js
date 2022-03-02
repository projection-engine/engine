import Component from "../basic/Component";
import {mat3} from "gl-matrix";

export default class MaterialComponent extends Component{
    materialID
    constructor(id, materialID) {
        super(id, MaterialComponent.constructor.name);
        this.materialID = materialID
    }
}