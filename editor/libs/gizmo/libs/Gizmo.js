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

    translation = undefined
    mainEntity = undefined
    updateTransformationRealtime = false
    key

    constructor() {
        this.renderTarget = document.getElementById(INFORMATION_CONTAINER.TRANSFORMATION)
    }

    onMouseMove() {
        if (!this.started && GizmoSystem.mainEntity?.components && GizmoSystem.mainEntity.components[COMPONENTS.TRANSFORM]) {
            this.started = true
            RendererStoreController.saveEntity(
                GizmoSystem.mainEntity.id,
                COMPONENTS.TRANSFORM,
                this.key,
                GizmoSystem.mainEntity.components[COMPONENTS.TRANSFORM][this.key]
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
        this.#testClick()

        if(GizmoSystem.clickedAxis === AXIS.SCREEN_SPACE)
            ScreenSpaceGizmo.onMouseDown(event)
    }

    notify(value, sign) {
        this.totalMoved += sign * value
        this.renderTarget.innerText = this.totalMoved.toFixed(3) + " un"
    }

    onMouseUp() {
        if (GizmoSystem.clickedAxis === AXIS.SCREEN_SPACE)
            ScreenSpaceGizmo.onMouseUp()

        if (this.totalMoved !== 0) {
            RendererStoreController.saveEntity(
                GizmoSystem.mainEntity.id,
                COMPONENTS.TRANSFORM,
                this.key,
                GizmoSystem.mainEntity.components[COMPONENTS.TRANSFORM][this.key]
            )
        }
        this.totalMoved = 0
        this.started = false
        document.exitPointerLock()
        this.distanceX = 0
        this.distanceY = 0
        this.distanceZ = 0
        GizmoSystem.clickedAxis = -1
        this.tracking = false
        this.renderTarget.style.display = "none"
    }

    exit() {
        this.tracking = false
    }

    #testClick() {
        if (!GizmoSystem.mainEntity || !GizmoSystem.mainEntity.components[COMPONENTS.TRANSFORM])
            return

        const mX = Gizmo.translateMatrix(this.xGizmo.components[COMPONENTS.TRANSFORM])
        const mY = Gizmo.translateMatrix(this.yGizmo.components[COMPONENTS.TRANSFORM])
        const mZ = Gizmo.translateMatrix(this.zGizmo.components[COMPONENTS.TRANSFORM])
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
            this.tracking = true
            gpu.canvas.requestPointerLock()
            this.renderTarget.style.display = "block"
        }
    }


    static translateMatrix(comp) {
        if (!GizmoSystem.translation)
            return
        const matrix = comp.transformationMatrix.slice(0)

        const translation = comp.translation,
            rotationQuat = comp.rotationQuat,
            scale = comp.scaling
        if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.RELATIVE)
            mat4.fromRotationTranslationScaleOrigin(
                matrix,
                quat.multiply([], GizmoSystem.targetRotation, rotationQuat),
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
        if (this.updateTransformationRealtime)
            GizmoSystem.translation = getEntityTranslation(GizmoSystem.mainEntity)
        const mX = Gizmo.translateMatrix(this.xGizmo.components[COMPONENTS.TRANSFORM])
        const mY = Gizmo.translateMatrix(this.yGizmo.components[COMPONENTS.TRANSFORM])
        const mZ = Gizmo.translateMatrix(this.zGizmo.components[COMPONENTS.TRANSFORM])

        this.xyz.use()
        if (this.tracking && GizmoSystem.clickedAxis === AXIS.X || !this.tracking)
            Gizmo.drawGizmo(this.xyz, mX, AXIS.X, this.xGizmo.pickID, GizmoSystem.translation, GizmoSystem.clickedAxis)
        if (this.tracking && GizmoSystem.clickedAxis === AXIS.Y || !this.tracking)
            Gizmo.drawGizmo(this.xyz, mY, AXIS.Y, this.yGizmo.pickID, GizmoSystem.translation, GizmoSystem.clickedAxis)
        if (this.tracking && GizmoSystem.clickedAxis === AXIS.Z || !this.tracking)
            Gizmo.drawGizmo(this.xyz, mZ, AXIS.Z, this.zGizmo.pickID, GizmoSystem.translation, GizmoSystem.clickedAxis)
    }

    static drawGizmo(mesh, transformMatrix, axis, id, translation, selectedAxis) {
        GizmoSystem.gizmoShader.bindForUse({
            viewMatrix: CameraAPI.viewMatrix,
            transformMatrix,
            projectionMatrix: CameraAPI.projectionMatrix,
            camPos: CameraAPI.position,
            translation,
            axis,
            selectedAxis,
            uID: id,
            cameraIsOrthographic: CameraAPI.isOrthographic
        })
        mesh.draw()
    }
}
