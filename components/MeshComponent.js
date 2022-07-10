import Component from "../basic/Component"
import {mat3} from "gl-matrix"
import MESH_TYPES from "../templates/MESH_TYPES"

export default class MeshComponent extends Component{
    meshID
    normalMatrix = mat3.create()
    meshType= MESH_TYPES.STATIC


    materialID
    overrideMaterial = false
    radius = 50
    doubleSided = true
    irradiance = []
    cubeMap = {}
    uniforms = []
    uniformValues = {}

    constructor(id, meshID, materialID) {
        super(id)
        this.meshID=meshID
        this.materialID = materialID
    }
}