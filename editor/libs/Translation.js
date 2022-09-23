import {vec3, vec4} from "gl-matrix"
import TRANSFORMATION_TYPE from "../../../../src/editor/data/TRANSFORMATION_TYPE"
import mapGizmoMesh from "../utils/map-gizmo-mesh"
import GizmoSystem from "../services/GizmoSystem";
import ScreenSpaceGizmo from "./ScreenSpaceGizmo";
import GizmoInheritance from "./GizmoInheritance";

const MOVEMENT_SCALE = .001
export default class Translation extends GizmoInheritance {
    tracking = false
    currentCoord = undefined
    gridSize = .01
    key = "translation"

    static cache = [0, 0, 0]

    constructor() {
        super()
        this.xyz = GizmoSystem.translationGizmoMesh
        this.xGizmo = mapGizmoMesh("x", "TRANSLATION")
        this.yGizmo = mapGizmoMesh("y", "TRANSLATION")
        this.zGizmo = mapGizmoMesh("z", "TRANSLATION")
        this.updateTransformationRealtime = true
    }

    onMouseDown(event) {
        super.onMouseDown(event);
        Translation.cache = [0, 0, 0]
    }

    onMouseMove(event) {
        super.onMouseMove()
        const g = event.ctrlKey ? 1 : this.gridSize
        const vec = ScreenSpaceGizmo.onMouseMove(event, MOVEMENT_SCALE)
        let toApply, firstEntity = GizmoSystem.mainEntity
        if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.GLOBAL || GizmoSystem.selectedEntities.length > 1)
            toApply = vec
        else
            toApply = vec4.transformQuat([], [...vec, 1], firstEntity._rotationQuat)
        vec3.add(Translation.cache, Translation.cache, toApply)
        if (Math.abs(Translation.cache[0]) >= g || Math.abs(Translation.cache[1]) >= g || Math.abs(Translation.cache[2]) >= g) {

            const entities = GizmoSystem.selectedEntities
            for (let i = 0; i < entities.length; i++) {
                const target = entities[i]

                vec3.add(target._translation, target._translation, Translation.cache)

                for (let j = 0; j < 3; j++)
                    target._translation[j] = Math.round(target._translation[j] / g) * g
                target.__changedBuffer[0] = 1
            }
            GizmoSystem.notify(GizmoSystem.mainEntity._translation)
            Translation.cache = [0, 0, 0]
        }
    }


}
