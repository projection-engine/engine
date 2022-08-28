import Component from "../basic/Component"
import {mat3} from "gl-matrix"
import MESH_TYPES from "../../data/MESH_TYPES"
import FALLBACK_MATERIAL from "../../data/FALLBACK_MATERIAL";

export default class MeshComponent extends Component{

    meshID
    normalMatrix = mat3.create()
    meshType= MESH_TYPES.STATIC
    name = "MESH"

    materialID = FALLBACK_MATERIAL
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