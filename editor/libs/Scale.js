import {vec3, vec4} from "gl-matrix"
import TRANSFORMATION_TYPE from "../../../../src/editor/data/TRANSFORMATION_TYPE"
import mapGizmoMesh from "../utils/map-gizmo-mesh"
import GizmoSystem from "../services/GizmoSystem";
import ScreenSpaceGizmo from "./ScreenSpaceGizmo";
import GizmoInheritance from "./GizmoInheritance";

const MOVEMENT_SCALE = .001
export default class Scale extends GizmoInheritance {
    gridSize = .01
    key = "scaling"

    static cache = [0, 0, 0]

    constructor() {
        super()
        this.xyz = GizmoSystem.scaleGizmoMesh
        this.xGizmo = mapGizmoMesh("x", "SCALE")
        this.yGizmo = mapGizmoMesh("y", "SCALE")
        this.zGizmo = mapGizmoMesh("z", "SCALE")
    }
onMouseDown(event) {
    super.onMouseDown(event);
    Scale.cache = [0,0,0]
}

    onMouseMove(event) {
        super.onMouseMove()
        const g = event.ctrlKey ? 1 : this.gridSize
        const vec = ScreenSpaceGizmo.onMouseMove(event, MOVEMENT_SCALE)
        let toApply, firstEntity = GizmoSystem.mainEntity
        if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.GLOBAL || GizmoSystem.selectedEntities.length > 1)
            toApply = vec4.transformQuat([], [...vec, 1], firstEntity._rotationQuat)
        else
            toApply = vec
        vec3.add(Scale.cache, Scale.cache, toApply)
        if (Math.abs(Scale.cache[0]) >= g || Math.abs(Scale.cache[1]) >= g || Math.abs(Scale.cache[2]) >= g) {

            const entities = GizmoSystem.selectedEntities
            for (let i = 0; i < entities.length; i++) {
                const target = entities[i]
                vec3.add(target._scaling, target._scaling, Scale.cache)
                for (let j = 0; j < 3; j++)
                    target._scaling[j] = Math.round(target._scaling[j] / g) * g
                target.__changedBuffer[0] = 1
            }
            GizmoSystem.notify(GizmoSystem.mainEntity._scaling)
            Scale.cache = [0, 0, 0]
        }
    }
}
