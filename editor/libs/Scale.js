import {vec3, vec4} from "gl-matrix"
import TRANSFORMATION_TYPE from "../../../../src/editor/data/TRANSFORMATION_TYPE"
import mapGizmoMesh from "../utils/map-gizmo-mesh"
import GizmoSystem from "../services/GizmoSystem";
import ScreenSpaceGizmo from "./ScreenSpaceGizmo";
import GizmoInheritance from "./GizmoInheritance";

const MOVEMENT_SCALE = .1
export default class Scale extends GizmoInheritance {
    gridSize = .01
    key = "scaling"

    constructor() {
        super()
        this.xyz = GizmoSystem.scaleGizmoMesh
        this.xGizmo = mapGizmoMesh("x", "SCALE")
        this.yGizmo = mapGizmoMesh("y", "SCALE")
        this.zGizmo = mapGizmoMesh("z", "SCALE")
    }

    onMouseMove(event) {
        super.onMouseMove()
        const position = ScreenSpaceGizmo.onMouseMove(event, MOVEMENT_SCALE, this.gridSize)
        this.moveEntities(position)
        GizmoSystem.notify(GizmoSystem.mainEntity._scaling)
    }

    moveEntities(vec) {
        let toApply
        if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.RELATIVE || GizmoSystem.selectedEntities.length > 1)
            toApply = vec
        else
            toApply = vec4.transformQuat([], vec, GizmoSystem.selectedEntities[0].rotationQuaternion)
        for (let i = 0; i < GizmoSystem.selectedEntities.length; i++) {
            const entity = GizmoSystem.selectedEntities[i]
            vec3.add(entity.scaling, entity.scaling, toApply)
            entity.changed = true
        }
    }
}
