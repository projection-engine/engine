import randomID from "../../../../components/shared/utils/randomID";
import Transformation from "./Transformation";

export default class InstancedStaticMesh extends Transformation{
    name
    id
    constructor(id = randomID(), name = 'New instance') {
        super();
        this.id = id
        this.name = name
        this._updateNormalMatrix()
    }
}

