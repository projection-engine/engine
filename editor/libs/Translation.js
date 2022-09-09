import {vec3, vec4} from "gl-matrix"
import TRANSFORMATION_TYPE from "../../../../data/TRANSFORMATION_TYPE"
import Gizmo from "./Gizmo"
import mapGizmoMesh from "../utils/map-gizmo-mesh"
import GizmoSystem from "../services/GizmoSystem";
import ScreenSpaceGizmo from "./ScreenSpaceGizmo";

const MOVEMENT_SCALE = .1
export default class Translation extends Gizmo {
    clickedAxis = -1
    tracking = false
    currentCoord = undefined
    gridSize = .01
    key = "translation"

    constructor() {
        super()
        this.xyz = GizmoSystem.translationGizmoMesh
        this.xGizmo = mapGizmoMesh("x", "TRANSLATION")
        this.yGizmo = mapGizmoMesh("y", "TRANSLATION")
        this.zGizmo = mapGizmoMesh("z", "TRANSLATION")
        this.updateTransformationRealtime = true
    }


    onMouseMove(event) {
        super.onMouseMove()
        const position = ScreenSpaceGizmo.onMouseMove(event, MOVEMENT_SCALE, this.gridSize)
        this.moveEntities(position)
        Gizmo.notify()
    }

    moveEntities(vec) {
        let toApply, firstEntity = GizmoSystem.mainEntity
        if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.GLOBAL || GizmoSystem.selectedEntities.length > 1)
            toApply = vec
        else
            toApply = vec4.transformQuat([], [...vec, 1], firstEntity.rotationQuaternion)
        const entities = GizmoSystem.selectedEntities
        for (let i = 0; i < entities.length; i++) {
            const target = entities[i]
            console.log(toApply)
            vec3.add(target.translation, target.translation, toApply)

            target.changed = true
        }
    }
}
