import {mat4, quat, vec3} from "gl-matrix"
import TRANSFORMATION_TYPE from "../../../../../../data/misc/TRANSFORMATION_TYPE"
import Conversion from "../../../../production/libs/Conversion"
import INFORMATION_CONTAINER from "../../../../../../data/misc/INFORMATION_CONTAINER"
import RendererStoreController from "../../../../../../stores/RendererStoreController";
import ViewportPicker from "../../../../production/libs/ViewportPicker";
import CameraAPI from "../../../../production/libs/apis/CameraAPI";
import GizmoSystem from "../../../services/GizmoSystem";
import AXIS from "../../../data/AXIS";
import ScreenSpaceGizmo from "../ScreenSpaceGizmo";
import DualAxisGizmo from "../DualAxisGizmo";

export default class Gizmo {
    tracking = false
    xGizmo
    yGizmo
    zGizmo
    xyz
    gridSize
    totalMoved = 0
    started = false
    updateTransformationRealtime = false
    key

    static movement = [0, 0, 0]
    static tooltip

    onMouseMove() {
        if (!this.started && GizmoSystem.mainEntity) {
            this.started = true
            RendererStoreController.saveEntity(
                GizmoSystem.mainEntity.id,
                undefined,
                this.key,
                GizmoSystem.mainEntity[this.key]
            )
        }
    }

    onMouseDown(event) {
        if (!Gizmo.tooltip)
            Gizmo.tooltip = document.getElementById(INFORMATION_CONTAINER.TRANSFORMATION)

        const w = gpu.canvas.width, h = gpu.canvas.height
        const x = event.clientX
        const y = event.clientY

        this.currentCoord = Conversion.toQuadCoord({x, y}, {w, h})
        ScreenSpaceGizmo.onMouseDown(event)
        this.#testClick()
    }

    static notify(position) {
        if(!Gizmo.tooltip)
            return
        Gizmo.tooltip.isChanging()
        GizmoSystem.totalMoved = 1
        Gizmo.tooltip.textContent = `X ${position[0].toFixed(2)}  |  Y ${position[1].toFixed(2)}  |  Z ${position[2].toFixed(2)}`
    }

    onMouseUp() {
        if(Gizmo.tooltip)
            Gizmo.tooltip.finished()
        ScreenSpaceGizmo.onMouseUp()

        if (GizmoSystem.totalMoved !== 0) {
            GizmoSystem.totalMoved = 0
            RendererStoreController.saveEntity(
                GizmoSystem.mainEntity.id,
                undefined,
                this.key,
                GizmoSystem.mainEntity[this.key]
            )
        }

        this.tracking = false
        this.started = false

        document.exitPointerLock()
        Gizmo.movement = [0, 0, 0]
        GizmoSystem.clickedAxis = -1
        Gizmo.tooltip.style.display = "none"
    }


    #testClick() {
        if (!GizmoSystem.mainEntity || GizmoSystem.mainEntity?.lockedScaling && this.key === "scaling")
            return
        const mX = Gizmo.translateMatrix(this.xGizmo)
        const mY = Gizmo.translateMatrix(this.yGizmo)
        const mZ = Gizmo.translateMatrix(this.zGizmo)
        const FBO = GizmoSystem.drawToDepthSampler(this.xyz, [mX, mY, mZ])
        const dd = ViewportPicker.depthPick(FBO, this.currentCoord)
        const pickID = Math.round(255 * dd[0])
        GizmoSystem.clickedAxis = pickID

        if (pickID === 0)
            this.onMouseUp(true)
        else {
            GizmoSystem.wasOnGizmo = true
            this.tracking = true
            gpu.canvas.requestPointerLock()
            Gizmo.tooltip.style.display = "block"
        }
    }


    static translateMatrix(entity) {
        if (!GizmoSystem.translation)
            return
        const matrix = entity.transformationMatrix.slice(0)

        const translation = entity.translation,
            rotationQuaternion = entity.rotationQuaternion,
            scale = entity.scaling
        if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.RELATIVE)
            mat4.fromRotationTranslationScaleOrigin(
                matrix,
                quat.multiply([], GizmoSystem.targetRotation, rotationQuaternion),
                vec3.add([], GizmoSystem.translation, translation),
                scale,
                translation
            )
        else {
            matrix[12] += GizmoSystem.translation[0]
            matrix[13] += GizmoSystem.translation[1]
            matrix[14] += GizmoSystem.translation[2]
        }
        return matrix
    }

    drawGizmo() {
        if (GizmoSystem.mainEntity?.lockedScaling && this.key === "scaling")
            return

        gpu.disable(gpu.CULL_FACE)
        DualAxisGizmo.drawGizmo()

        if (this.updateTransformationRealtime)
            GizmoSystem.updateTranslation()
        const mX = Gizmo.translateMatrix(this.xGizmo)
        const mY = Gizmo.translateMatrix(this.yGizmo)
        const mZ = Gizmo.translateMatrix(this.zGizmo)

        if (this.tracking && GizmoSystem.clickedAxis === AXIS.X || !this.tracking)
            Gizmo.drawGizmo(this.xyz, mX, AXIS.X, this.xGizmo.pickID)
        if (this.tracking && GizmoSystem.clickedAxis === AXIS.Y || !this.tracking)
            Gizmo.drawGizmo(this.xyz, mY, AXIS.Y, this.yGizmo.pickID)
        if (this.tracking && GizmoSystem.clickedAxis === AXIS.Z || !this.tracking)
            Gizmo.drawGizmo(this.xyz, mZ, AXIS.Z, this.zGizmo.pickID)
        gpu.enable(gpu.CULL_FACE)
    }

    static drawGizmo(mesh, transformMatrix, axis, uID) {
        GizmoSystem.gizmoShader.bindForUse({
            viewMatrix: CameraAPI.viewMatrix,
            transformMatrix,
            projectionMatrix: CameraAPI.projectionMatrix,
            camPos: CameraAPI.position,
            translation: GizmoSystem.translation,
            axis,
            selectedAxis: GizmoSystem.clickedAxis,
            uID,
            cameraIsOrthographic: CameraAPI.isOrthographic
        })
        mesh.draw()
    }
}
