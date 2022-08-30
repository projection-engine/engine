import {vec3, vec4} from "gl-matrix"
import TRANSFORMATION_TYPE from "../../../../../data/misc/TRANSFORMATION_TYPE"
import Gizmo from "./libs/Gizmo"
import mapEntity from "./utils/map-entity"
import GizmoSystem from "../../services/GizmoSystem";
import ScreenSpaceGizmo from "./ScreenSpaceGizmo";

const MOVEMENT_SCALE = .1
export default class Scale extends Gizmo {
    tracking = false

    gridSize = .01
    distanceX = 0
    distanceY = 0
    distanceZ = 0
    key = "scaling"

    constructor() {
        super()
        this.xyz = GizmoSystem.scaleGizmoMesh
        this.xGizmo = mapEntity("x", "SCALE")
        this.yGizmo = mapEntity("y", "SCALE")
        this.zGizmo = mapEntity("z", "SCALE")
    }

    onMouseMove(event) {
        super.onMouseMove()
        const position = ScreenSpaceGizmo.onMouseMove(event, MOVEMENT_SCALE, this.gridSize)
        this.moveEntities(position)
        Gizmo.notify(position)
    }

    moveEntities(vec) {
        let toApply
        if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.RELATIVE || GizmoSystem.selectedEntities.length > 1)
            toApply = vec
        else
            toApply = vec4.transformQuat([], vec, GizmoSystem.selectedEntities[0].rotationQuaternion)
        for (let i = 0; i < GizmoSystem.selectedEntities.length; i++) {
            const entity = GizmoSystem.selectedEntities[i]
            const moved = vec3.sub([], toApply, entity.scaling)
            ScreenSpaceGizmo.mapToAxis(moved)
            vec3.add(entity.scaling, entity.scaling, moved)
            entity.changed = true
        }
    }
}
