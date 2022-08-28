import {vec3, vec4} from "gl-matrix"
import MeshInstance from "../../../production/libs/instances/MeshInstance"
import COMPONENTS from "../../../production/data/COMPONENTS"
import TRANSFORMATION_TYPE from "../../../../../data/misc/TRANSFORMATION_TYPE"
import Gizmo from "./libs/Gizmo"
import mapEntity from "./utils/map-entity"
import TRANSLATION_GIZMO from "../../data/TRANSLATION_GIZMO.json"
import GizmoSystem from "../../services/GizmoSystem";
import AXIS from "./AXIS";
import ScreenSpaceGizmo from "./ScreenSpaceGizmo";
import GPU from "../../../production/GPU";
import STATIC_MESHES from "../../../static/STATIC_MESHES";
import ROTATION_GIZMO from "../../data/ROTATION_GIZMO.json";

const MOVEMENT_SCALE = .001
export default class Translation extends Gizmo {
    clickedAxis = -1
    tracking = false
    currentCoord = undefined
    gridSize = .01
    key = "translation"

    constructor() {
        super()
        this.xyz = GizmoSystem.translationGizmoMesh
        this.xGizmo = mapEntity("x", "TRANSLATION")
        this.yGizmo = mapEntity("y", "TRANSLATION")
        this.zGizmo = mapEntity("z", "TRANSLATION")
        this.updateTransformationRealtime = true
    }


    onMouseMove(event) {
        super.onMouseMove()
        const s = Math.abs(this.gridSize > 1 ? event.movementX * MOVEMENT_SCALE * this.gridSize : event.movementX * MOVEMENT_SCALE)
        const sign = Math.sign(event.movementX)

        switch (GizmoSystem.clickedAxis) {
            case AXIS.X:
                this.distanceX += s
                if (Math.abs(this.distanceX) >= this.gridSize) {
                    this.notify(this.distanceX, sign)
                    this.transformElement([sign * this.distanceX, 0, 0])
                    this.distanceX = 0
                }
                break
            case AXIS.Y:
                this.distanceY += s
                if (Math.abs(this.distanceY) >= this.gridSize) {
                    this.notify(this.distanceY, sign)
                    this.transformElement([0, sign * this.distanceY, 0])
                    this.distanceY = 0
                }
                break
            case AXIS.Z:
                this.distanceZ += s
                if (Math.abs(this.distanceZ) >= this.gridSize) {
                    this.notify(this.distanceZ, sign)
                    this.transformElement([0, 0, sign * this.distanceZ])
                    this.distanceZ = 0
                }
                break
            case AXIS.XY:
            case AXIS.XZ:
            case AXIS.ZY:
            case AXIS.SCREEN_SPACE: {
                const position = ScreenSpaceGizmo.onMouseMove(event)
                for (let i = 0; i < GizmoSystem.selectedEntities.length; i++) {
                    const target = GizmoSystem.selectedEntities[i]
                    const translation = target.translation
                    const moved = vec3.sub([], position, translation)
                    if (GizmoSystem.clickedAxis === AXIS.ZY)
                        moved[0] =0
                    if (GizmoSystem.clickedAxis === AXIS.XZ)
                        moved[1] = 0
                    if (GizmoSystem.clickedAxis === AXIS.XY)
                        moved[2] = 0
                    vec3.add(target.translation, translation, moved)
                    target.changed = true
                }
                break
            }
            default:
                break
        }

    }

    transformElement(vec) {
        let toApply, firstEntity = GizmoSystem.mainEntity
        if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.GLOBAL || GizmoSystem.selectedEntities.length > 1)
            toApply = vec
        else
            toApply = vec4.transformQuat([], vec, firstEntity.rotationQuaternion)
        const entities = GizmoSystem.selectedEntities
        for (let i = 0; i < entities.length; i++) {
            const target = entities[i]
            vec3.add(target.translation, target.translation, toApply)
            target.changed = true
        }
    }
}
