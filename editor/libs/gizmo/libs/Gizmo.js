import {mat4, quat, vec3} from "gl-matrix"
import COMPONENTS from "../../../../production/data/COMPONENTS"
import TRANSFORMATION_TYPE from "../../../../../../data/misc/TRANSFORMATION_TYPE"
import Conversion from "../../../../production/services/Conversion"
import getEntityTranslation from "../utils/get-entity-translation"
import INFORMATION_CONTAINER from "../../../../../../data/misc/INFORMATION_CONTAINER"
import RendererStoreController from "../../../../../../stores/RendererStoreController";
import ViewportPicker from "../../../../production/services/ViewportPicker";
import CameraAPI from "../../../../production/libs/apis/CameraAPI";
import GizmoSystem from "../../../services/GizmoSystem";
import AXIS from "../AXIS";
import ScreenSpaceGizmo from "../ScreenSpaceGizmo";
import DualAxisGizmo from "../DualAxisGizmo";

export default class Gizmo {
    tracking = false
    distanceX = 0
    distanceY = 0
    distanceZ = 0
    xGizmo
    yGizmo
    zGizmo
    xyz
    gridSize
    totalMoved = 0

    started = false

    updateTransformationRealtime = false
    key

    constructor() {
        this.renderTarget = document.getElementById(INFORMATION_CONTAINER.TRANSFORMATION)
    }

    onMouseMove() {
        if (!this.started && GizmoSystem.mainEntity?.components) {
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

        if (!this.renderTarget)
            this.renderTarget = document.getElementById(INFORMATION_CONTAINER.TRANSFORMATION)

        const w = gpu.canvas.width, h = gpu.canvas.height
        const x = event.clientX
        const y = event.clientY

        this.currentCoord = Conversion.toQuadCoord({x, y}, {w, h})
        ScreenSpaceGizmo.onMouseDown(event)
        this.#testClick()

    }

    notify(value, sign) {
        GizmoSystem.totalMoved += sign * value
        this.renderTarget.innerText = GizmoSystem.totalMoved.toFixed(3) + " un"
    }

    onMouseUp() {
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

        this.started = false
        document.exitPointerLock()
        this.distanceX = 0
        this.distanceY = 0
        this.distanceZ = 0
        GizmoSystem.clickedAxis = -1

        this.tracking = false
        this.renderTarget.style.display = "none"
    }


    #testClick() {
        if(!GizmoSystem.mainEntity || GizmoSystem.mainEntity?.lockedScaling && this.key === "scaling")
            return
        const mX = Gizmo.translateMatrix(this.xGizmo)
        const mY = Gizmo.translateMatrix(this.yGizmo)
        const mZ = Gizmo.translateMatrix(this.zGizmo)
        const FBO = GizmoSystem.drawToDepthSampler(
            this.xyz,
            [mX, mY, mZ]
        )
        const dd = ViewportPicker.depthPick(FBO, this.currentCoord)
        const pickID = Math.round(255 * (dd[0]))
        GizmoSystem.clickedAxis = pickID

        if (pickID === 0)
            this.onMouseUp(true)
        else {
            GizmoSystem.wasOnGizmo = true
            this.tracking = true
            gpu.canvas.requestPointerLock()
            this.renderTarget.style.display = "block"
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
        if(GizmoSystem.mainEntity?.lockedScaling && this.key === "scaling")
            return

        gpu.disable(gpu.CULL_FACE)
        DualAxisGizmo.drawGizmo()

        if (this.updateTransformationRealtime)
            GizmoSystem.translation = getEntityTranslation(GizmoSystem.mainEntity)
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
