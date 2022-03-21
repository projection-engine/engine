import System from "../../basic/System";
import TranslationGizmo from "../../../utils/gizmo/TranslationGizmo";
import RotationGizmo from "../../../utils/gizmo/RotationGizmo";
import GIZMOS from "../../../utils/misc/GIZMOS";
import ScaleGizmo from "../../../utils/gizmo/ScaleGizmo";

export default class GizmoSystem extends System {

    constructor(gpu) {
        super([]);
        this.gpu = gpu

        this.translationGizmo = new TranslationGizmo(gpu)
        this.rotationGizmo = new RotationGizmo(gpu)
        this.scaleGizmo = new ScaleGizmo(gpu)

    }


    execute(meshes, meshSources, selected, camera, pickSystem, setSelected, lockCamera, entities, gizmo) {
        super.execute()
        this.gpu.clear(this.gpu.DEPTH_BUFFER_BIT)
        switch (gizmo){
            case GIZMOS.TRANSLATION:
                this.translationGizmo.execute(meshes, meshSources, selected, camera, pickSystem, setSelected, lockCamera, entities)
                break
            case GIZMOS.ROTATION:
                this.rotationGizmo.execute(meshes, meshSources, selected, camera, pickSystem, setSelected, lockCamera, entities)
                break
            case GIZMOS.SCALE:
                this.scaleGizmo.execute(meshes, meshSources, selected, camera, pickSystem, setSelected, lockCamera, entities)
                break
        }

    }
}
