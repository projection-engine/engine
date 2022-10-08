import {vec3, vec4} from "gl-matrix"
import TRANSFORMATION_TYPE from "../../../../../src/editor/data/TRANSFORMATION_TYPE"
import mapGizmoMesh from "../../utils/map-gizmo-mesh"
import GizmoSystem from "../../services/GizmoSystem";
import ScreenSpaceGizmo from "./ScreenSpaceGizmo";
import Inheritance from "../Inheritance";

export default class TranslationGizmo extends Inheritance {
    tracking = false
    gridSize = 1
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
        TranslationGizmo.cache = [0, 0, 0]
    }

    onMouseMove(event) {
        super.onMouseMove()
        const g = event.ctrlKey ? 1 : this.gridSize
        const vec = ScreenSpaceGizmo.onMouseMove(event, GizmoSystem.sensitivity)
        let toApply, firstEntity = GizmoSystem.mainEntity
        if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.GLOBAL || GizmoSystem.selectedEntities.length > 1)
            toApply = vec
        else
            toApply = vec4.transformQuat([], [...vec, 1], firstEntity._rotationQuat)
        vec3.add(TranslationGizmo.cache, TranslationGizmo.cache, toApply)
        if (Math.abs(TranslationGizmo.cache[0]) >= g || Math.abs(TranslationGizmo.cache[1]) >= g || Math.abs(TranslationGizmo.cache[2]) >= g) {

            const entities = GizmoSystem.selectedEntities
            const SIZE = entities.length
            if (SIZE === 1 && entities[0].lockedTranslation)
                return
            for (let i = 0; i < SIZE; i++) {
                const target = entities[i]
                if (target.lockedTranslation)
                    continue

                vec3.add(target._translation, target._translation, TranslationGizmo.cache)

                for (let j = 0; j < 3; j++)
                    target._translation[j] = Math.round(target._translation[j] / g) * g
                target.__changedBuffer[0] = 1
            }
            GizmoSystem.notify(GizmoSystem.mainEntity._translation)
            TranslationGizmo.cache = [0, 0, 0]
        }
    }


}