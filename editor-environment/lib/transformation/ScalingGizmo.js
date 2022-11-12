import {vec3, vec4} from "gl-matrix"
import TRANSFORMATION_TYPE from "../../../../../src/static/TRANSFORMATION_TYPE"
import mapGizmoMesh from "../../utils/map-gizmo-mesh"
import GizmoSystem from "../../runtime/GizmoSystem";
import ScreenSpaceGizmo from "./ScreenSpaceGizmo";
import Inheritance from "../Inheritance";
import Wrapper from "../../Wrapper";

export default class ScalingGizmo extends Inheritance {
    gridSize = 1
    key = "_scaling"

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
        ScalingGizmo.cache = [0, 0, 0]
    }

    onMouseMove(event) {
        super.onMouseMove()
        const isGlobal = GizmoSystem.transformationType === TRANSFORMATION_TYPE.GLOBAL
        const g = event.ctrlKey ? 1 : this.gridSize
        const vec = ScreenSpaceGizmo.onMouseMove(event, GizmoSystem.sensitivity)
        let toApply, firstEntity = GizmoSystem.mainEntity
        if (isGlobal || Wrapper.selected.length > 1)
            toApply = vec4.transformQuat([], [...vec, 1], firstEntity._rotationQuat)
        else
            toApply = vec
        vec3.add(ScalingGizmo.cache, ScalingGizmo.cache, toApply)

        let reversed
        if (isGlobal)
            reversed = vec3.scale([], ScalingGizmo.cache, -1)

        if (Math.abs(ScalingGizmo.cache[0]) >= g || Math.abs(ScalingGizmo.cache[1]) >= g || Math.abs(ScalingGizmo.cache[2]) >= g) {
            const entities = Wrapper.selected
            const SIZE = entities.length
            if (SIZE === 1 && entities[0].lockedScaling)
                return
            for (let i = 0; i < SIZE; i++) {
                const target = entities[i]
                if (target.lockedScaling)
                    continue

                vec3.add(target._scaling, target._scaling, ScalingGizmo.cache)
                if (isGlobal && event.altKey)
                    vec3.add(target._translation, target._translation, reversed)
                for (let j = 0; j < 3; j++)
                    target._scaling[j] = Math.round(target._scaling[j] / g) * g
                target.__changedBuffer[0] = 1
            }
            ScalingGizmo.cache = [0, 0, 0]
        }
    }
}
