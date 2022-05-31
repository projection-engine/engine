import Component from "../basic/Component"
import {mat3} from "gl-matrix"

export default class TerrainComponent extends Component{
    terrainID
    normalMatrix = mat3.create()
    materialID
    constructor(id, terrainID) {
        super(id, TerrainComponent.constructor.name);
        this.terrainID=terrainID

    }
}