import System from "../../basic/System";
import TranslationGizmo from "../../../utils/gizmo/TranslationGizmo";
import RotationGizmo from "../../../utils/gizmo/RotationGizmo";

export default class GizmoSystem extends System {

    constructor(gpu) {
        super([]);
        this.gpu = gpu

        this.translationGizmo = new TranslationGizmo(gpu)
        this.rotationGizmo = new RotationGizmo(gpu)
    }


    execute(meshes, meshSources, selected, camera, pickSystem, setSelected, lockCamera, entities) {
        super.execute()
        this.rotationGizmo.execute(meshes, meshSources, selected, camera, pickSystem, setSelected, lockCamera, entities)
    }
}
