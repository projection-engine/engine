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
        const vec = ScreenSpaceGizmo.onMouseMove(event, MOVEMENT_SCALE, this.gridSize)
        let toApply, firstEntity = GizmoSystem.mainEntity
        if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.GLOBAL || GizmoSystem.selectedEntities.length > 1)
            toApply = vec
        else
            toApply = vec4.transformQuat([], [...vec, 1], firstEntity._rotationQuat)

        const entities = GizmoSystem.selectedEntities
        for (let i = 0; i < entities.length; i++) {
            const target = entities[i]
            vec3.add(target._scaling, target._scaling, toApply)
            target.__changedBuffer[0] = 1
        }
        GizmoSystem.notify(GizmoSystem.mainEntity._scaling)
    }
}
