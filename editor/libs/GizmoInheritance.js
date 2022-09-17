import {mat4} from "gl-matrix"
import EngineStore from "../../../../src/editor/stores/EngineStore";

import GizmoSystem from "../services/GizmoSystem";
import AXIS from "../data/AXIS";
import ScreenSpaceGizmo from "./ScreenSpaceGizmo";
import DualAxisGizmo from "./DualAxisGizmo";
import {ConversionAPI, PickingAPI} from "../../production";
import GizmoAPI from "./GizmoAPI";

export default class GizmoInheritance {
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
            EngineStore.saveEntity(
                GizmoSystem.mainEntity.id,
                undefined,
                this.key,
                GizmoSystem.mainEntity[this.key]
            )
        }
    }

    onMouseDown(event) {
        GizmoSystem.onMouseDown()
        const w = gpu.canvas.width, h = gpu.canvas.height
        const x = event.clientX
        const y = event.clientY

        this.currentCoord = ConversionAPI.toQuadCoord({x, y}, {w, h})
        ScreenSpaceGizmo.onMouseDown(event)
        this.#testClick()
    }


    onMouseUp() {
        GizmoSystem.onMouseUp()
        if (GizmoSystem.totalMoved !== 0) {
            GizmoSystem.totalMoved = 0
            EngineStore.saveEntity(
                GizmoSystem.mainEntity.id,
                undefined,
                this.key,
                GizmoSystem.mainEntity[this.key]
            )
        }
        this.tracking = false
        this.started = false
        document.exitPointerLock()
        GizmoSystem.clickedAxis = -1
    }


    #testClick() {
        if (!GizmoSystem.mainEntity )
            return
        const mX = GizmoAPI.translateMatrix(this.xGizmo)
        const mY = GizmoAPI.translateMatrix(this.yGizmo)
        const mZ = GizmoAPI.translateMatrix(this.zGizmo)
        const FBO = GizmoSystem.drawToDepthSampler(this.xyz, [mX, mY, mZ])
        const dd = PickingAPI.depthPick(FBO, this.currentCoord)
        const pickID = Math.round(255 * dd[0])
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

        if (this.updateTransformationRealtime) {
            GizmoSystem.updateTranslation()
            GizmoSystem.transformationMatrix = GizmoAPI.translateMatrix(GizmoSystem.EMPTY_COMPONENT)
        }
        const mX = GizmoAPI.translateMatrix(this.xGizmo)
        const mY = GizmoAPI.translateMatrix(this.yGizmo)
        const mZ = GizmoAPI.translateMatrix(this.zGizmo)


        if (this.tracking && GizmoSystem.clickedAxis === AXIS.X || !this.tracking)
            GizmoAPI.drawGizmo(this.xyz, mX, AXIS.X, this.xGizmo.pickID)
        if (this.tracking && GizmoSystem.clickedAxis === AXIS.Y || !this.tracking)
            GizmoAPI.drawGizmo(this.xyz, mY, AXIS.Y, this.yGizmo.pickID)
        if (this.tracking && GizmoSystem.clickedAxis === AXIS.Z || !this.tracking)
            GizmoAPI.drawGizmo(this.xyz, mZ, AXIS.Z, this.zGizmo.pickID)

        if (this.key !== "scaling" && this.tracking) {
            const c = mat4.create()
            GizmoAPI.applyTransformation(c, [0,0,0,1], [0,0,0],  [1, 1, 1])
            GizmoSystem.activeGizmoMatrix = c
        }
        gpu.enable(gpu.CULL_FACE)
    }
}
