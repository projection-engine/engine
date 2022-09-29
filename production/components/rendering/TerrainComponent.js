import Component from "../Component"
import TERRAIN_PROPS from "../../../static/component-props/TERRAIN_PROPS";
import TERRAIN_MATERIAL from "../../materials/terrain-layered/TERRAIN_MATERIAL";

export default class TerrainComponent extends Component {
    name = "TERRAIN_COMPONENT"
    _props = TERRAIN_PROPS

    terrainID
    materialID = TERRAIN_MATERIAL + 1
    hasCollision = false
}