import {mat4} from "gl-matrix"

import GizmoSystem from "../services/GizmoSystem";
import AXIS from "../data/AXIS";
import DualAxisGizmo from "./transformation/DualAxisGizmo";
import {PickingAPI} from "../../production";
import GizmoAPI from "./GizmoAPI";

export default class Inheritance {
    tracking = false
    xGizmo
    yGizmo
    zGizmo
    xyz
    gridSize
    started = false
    updateTransformationRealtime = false
    key

    onMouseMove() {
        if (!this.started && GizmoSystem.mainEntity) {
            this.started = true
            GizmoSystem.save(this.key)
        }
    }

    onMouseDown(event) {
        GizmoSystem.onMouseDown()
        this.x = event.clientX
        this.y = event.clientY

        this.#testClick()
    }


    onMouseUp() {
        GizmoSystem.onMouseUp()
        if (GizmoSystem.totalMoved !== 0) {
            GizmoSystem.totalMoved = 0
            GizmoSystem.save(this.key)
        }
        this.tracking = false
        this.started = false
        document.exitPointerLock()
        GizmoSystem.clickedAxis = -1
    }


    #testClick() {
        if (!GizmoSystem.mainEntity)
            return
        const mX = GizmoAPI.translateMatrix(this.xGizmo)
        const mY = GizmoAPI.translateMatrix(this.yGizmo)
        const mZ = GizmoAPI.translateMatrix(this.zGizmo)
        GizmoSystem.drawToDepthSampler(this.xyz, [mX, mY, mZ])
        const pickID = PickingAPI.readEntityID(this.x, this.y)
        GizmoSystem.clickedAxis = pickID

        if (pickID === 0)
            this.onMouseUp(true)
        else {
            GizmoSystem.wasOnGizmo = true
            this.tracking = true
            gpu.canvas.requestPointerLock()
        }
    }

    drawGizmo() {
        if (!GizmoSystem.mainEntity)
            return

        gpu.disable(gpu.CULL_FACE)
        DualAxisGizmo.drawGizmo()

        if (this.updateTransformationRealtime)
            GizmoSystem.transformationMatrix = GizmoAPI.translateMatrix(GizmoSystem.EMPTY_COMPONENT)

        const mX = GizmoAPI.translateMatrix(this.xGizmo)
        const mY = GizmoAPI.translateMatrix(this.yGizmo)
        const mZ = GizmoAPI.translateMatrix(this.zGizmo)


        if (this.tracking && GizmoSystem.clickedAxis === AXIS.X || !this.tracking)
            GizmoAPI.drawGizmo(this.xyz, mX, AXIS.X, this.xGizmo.pickID)
        if (this.tracking && GizmoSystem.clickedAxis === AXIS.Y || !this.tracking)
            GizmoAPI.drawGizmo(this.xyz, mY, AXIS.Y, this.yGizmo.pickID)
        if (this.tracking && GizmoSystem.clickedAxis === AXIS.Z || !this.tracking)
            GizmoAPI.drawGizmo(this.xyz, mZ, AXIS.Z, this.zGizmo.pickID)

        if (this.key !== "_scaling" && this.tracking) {
            const c = mat4.create()
            GizmoAPI.applyTransformation(c, [0, 0, 0, 1], [0, 0, 0], [1, 1, 1])
            GizmoSystem.activeGizmoMatrix = c
        }
        gpu.enable(gpu.CULL_FACE)
    }
}
