import Component from "../basic/Component";
import {mat3} from "gl-matrix";

export default class MeshComponent extends Component{
    meshID
    normalMatrix = mat3.create()

    constructor(id, meshID) {
        super(id, MeshComponent.constructor.name);
        this.meshID=meshID
    }
}