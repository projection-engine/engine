import System from "../../basic/System";
import TranslationGizmo from "../../../utils/gizmo/TranslationGizmo";
import RotationGizmo from "../../../utils/gizmo/RotationGizmo";
import GIZMOS from "../../../templates/GIZMOS";
import ScaleGizmo from "../../../utils/gizmo/ScaleGizmo";
import ROTATION_TYPES from "../../../templates/ROTATION_TYPES";

export default class GizmoSystem extends System {

    constructor(gpu) {
        super([]);
        this.gpu = gpu

        const canvas = gpu.canvas
        const targetID = canvas.id.replace('-canvas', '-gizmo')
        if (document.getElementById(targetID) !== null)
            this.renderTarget = document.getElementById(targetID)
        else {
            this.renderTarget = document.createElement('div')
            this.renderTarget.id = targetID
            Object.assign(this.renderTarget.style, {
                backdropFilter: "blur(10px) brightness(70%)", borderRadius: "5px", width: "fit-content",
                height: 'fit-content', position: 'absolute', top: '4px', left: '4px', zIndex: '10',
                color: 'white', padding: '8px', fontSize: '.75rem',
                display: 'none'
            });
            canvas.parentNode.appendChild(this.renderTarget)
        }

        this.translationGizmo = new TranslationGizmo(gpu, this.renderTarget)
        this.rotationGizmo = new RotationGizmo(gpu, this.renderTarget)
        this.scaleGizmo = new ScaleGizmo(gpu, this.renderTarget)


    }


    execute(
        meshes,
        meshSources,
        selected,
        camera,
        pickSystem,
        lockCamera,
        entities,
        gizmo,
        transformationType = ROTATION_TYPES.GLOBAL,
        onGizmoStart,
        onGizmoEnd
    ) {
        super.execute()
        this.gpu.clear(this.gpu.DEPTH_BUFFER_BIT)
        switch (gizmo) {
            case GIZMOS.TRANSLATION:
                this.translationGizmo.execute(meshes, meshSources, selected, camera, pickSystem, lockCamera, entities, transformationType, onGizmoStart, onGizmoEnd)
                break
            case GIZMOS.ROTATION:
                this.rotationGizmo.execute(meshes, meshSources, selected, camera, pickSystem, lockCamera, entities, transformationType, onGizmoStart, onGizmoEnd)
                break
            case GIZMOS.SCALE:
                this.scaleGizmo.execute(meshes, meshSources, selected, camera, pickSystem, lockCamera, entities, onGizmoStart, onGizmoEnd)
                break
        }

    }
}
