import {vec4} from "gl-matrix"
import MeshInstance from "../../../production/libs/instances/MeshInstance"
import COMPONENTS from "../../../production/data/COMPONENTS"
import TRANSFORMATION_TYPE from "../../../../../data/misc/TRANSFORMATION_TYPE"
import Gizmo from "./libs/Gizmo"
import mapEntity from "./utils/map-entity"
import mesh from "../../data/TRANSLATION_GIZMO.json"
import GizmoSystem from "../../services/GizmoSystem";
import AXIS from "./AXIS";

const MOVEMENT_SCALE = .001
export default class Translation extends Gizmo {
    clickedAxis = -1
    tracking = false
    currentCoord = undefined
    gridSize = .01
    key = "translation"
    constructor() {
        super()
        this.xGizmo = mapEntity("x", "TRANSLATION")
        this.yGizmo = mapEntity("y", "TRANSLATION")
        this.zGizmo = mapEntity("z", "TRANSLATION")

        this.xyz = new MeshInstance({
            vertices: mesh.vertices,
            indices: mesh.indices,
            normals: mesh.normals,
            uvs: [],
            tangents: []
        })

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
        }

    }

    transformElement(vec) {
        let toApply, firstEntity =  GizmoSystem.mainEntity
        if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.GLOBAL || !firstEntity.components[COMPONENTS.TRANSFORM] ||  GizmoSystem.selectedEntities.length > 1)
            toApply = vec
        else
            toApply = vec4.transformQuat([], vec, firstEntity.components[COMPONENTS.TRANSFORM].rotationQuat)

        for (let i = 0; i <  GizmoSystem.selectedEntities.length; i++) {
            const target =  GizmoSystem.selectedEntities[i]
            target.components[COMPONENTS.TRANSFORM].translation = [
                target.components[COMPONENTS.TRANSFORM].translation[0] - toApply[0],
                target.components[COMPONENTS.TRANSFORM].translation[1] - toApply[1],
                target.components[COMPONENTS.TRANSFORM].translation[2] - toApply[2]
            ]
        }
    }

}
