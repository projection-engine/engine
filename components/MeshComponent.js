import Component from "../basic/Component"
import {mat3} from "gl-matrix"
import MESH_TYPES from "../templates/MESH_TYPES"

export default class MeshComponent extends Component{
    meshID
    normalMatrix = mat3.create()
    query
    meshType= MESH_TYPES.STATIC
    constructor(id, meshID) {
        super(id, MeshComponent.constructor.name);
        this.meshID=meshID


        this.queryInProgress = false
        this.occluded = false
    }
}