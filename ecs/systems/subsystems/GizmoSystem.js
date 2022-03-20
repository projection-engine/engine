import System from "../../basic/System";
import TranslationGizmo from "../../../utils/gizmo/TranslationGizmo";

export default class GizmoSystem extends System {

    constructor(gpu) {
        super([]);
        this.gpu = gpu

        this.translationGizmo = new TranslationGizmo(gpu)
    }


    execute(meshes, meshSources, selected, camera, pickSystem, setSelected, lockCamera, entities) {
        super.execute()
        this.translationGizmo.execute(meshes, meshSources, selected, camera, pickSystem, setSelected, lockCamera, entities)
    }
}
