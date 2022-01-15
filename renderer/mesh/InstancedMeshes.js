import InstancedStaticMesh from "./InstancedStaticMesh";
import randomID from "../../../components/shared/utils/randomID";

export default class InstancedMeshes {
    name
    id
    mesh
    children = []

    constructor(
        name = 'New instance',
        id = randomID(),
        mesh,
        material,
        children = [new InstancedStaticMesh()],
        gpu
        ) {
        this.id = id
        this.name = name
        this.material = material
        this.mesh = mesh
        this.children = children

        this.gpu = gpu


    }

    draw() {

    }
}