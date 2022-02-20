import Component from "../basic/Component";
import {mat3} from "gl-matrix";

export default class MeshComponent extends Component{
    meshID
    normalMatrix = mat3.create()
    query
    constructor(id, meshID) {
        super(id, MeshComponent.constructor.name);
        this.meshID=meshID


        this.queryInProgress = false
        this.occluded = false
    }
}