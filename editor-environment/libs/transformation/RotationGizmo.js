import {mat4, quat, vec3} from "gl-matrix"
import TRANSFORMATION_TYPE from "../../../../../src/data/TRANSFORMATION_TYPE"
import mapGizmoMesh from "../../utils/map-gizmo-mesh"
import PickingAPI from "../../../api/utils/PickingAPI";
import CameraAPI from "../../../api/CameraAPI";
import GizmoSystem from "../../services/GizmoSystem";
import AXIS from "../../data/AXIS";
import ScreenSpaceGizmo from "./ScreenSpaceGizmo";
import GPU from "../../../GPU";
import STATIC_TEXTURES from "../../../static/resources/STATIC_TEXTURES";

const toDeg = 57.29, toRad = Math.PI / 180

export default class RotationGizmo {
    tracking = false
    currentRotation = [0, 0, 0]
    gridSize = toRad

    started = false
    currentIncrement = 0
static shader
    constructor() {

        this.xGizmo = mapGizmoMesh("x", "ROTATION")
        this.yGizmo = mapGizmoMesh("y", "ROTATION")
        this.zGizmo = mapGizmoMesh("z", "ROTATION")
        this.texture = GPU.textures.get(STATIC_TEXTURES.ROTATION_GIZMO)
    }

    onMouseDown(event) {
        this.x = event.clientX
        this.y = event.clientY

        this.currentIncrement = 0
        this.#testClick()
    }

    onMouseUp() {
        if (GizmoSystem.totalMoved > 0) {
            GizmoSystem.totalMoved = 0
            GizmoSystem.save("_rotationQuat")
        }
        document.exitPointerLock()

        this.started = false
        GizmoSystem.clickedAxis = -1
        this.tracking = false
        this.currentRotation = [0, 0, 0]
    }


    onMouseMove(event) {
        if (!GizmoSystem.mainEntity)
            return
        if (!this.started) {
            this.started = true
            GizmoSystem.save("_rotationQuat")
        }

        const g = event.ctrlKey ? toRad : this.gridSize * toRad
        this.currentIncrement += event.movementX * GizmoSystem.sensitivity
        const mappedValue = Math.round(this.currentIncrement / g) * g

        if (Math.abs(mappedValue) > 0)
            this.currentIncrement = 0

        switch (GizmoSystem.clickedAxis) {
            case AXIS.X:
                this.rotateElement([mappedValue, 0, 0])
                break
            case AXIS.Y:
                this.rotateElement([0, mappedValue, 0])
                break
            case AXIS.Z:
                this.rotateElement([0, 0, mappedValue])

                break
            case AXIS.SCREEN_SPACE:
                const position = vec3.add([], this.currentRotation, ScreenSpaceGizmo.onMouseMove(event, toRad, this.gridSize))
                this.rotateElement(position, true)
                break
            default:
                break
        }
    }

    rotateElement(vec, screenSpace) {
        const targets = GizmoSystem.selectedEntities, SIZE = targets.length
        if (SIZE === 1 && GizmoSystem.mainEntity.lockedRotation)
            return

        GizmoSystem.totalMoved += vec[0] + vec[1] + vec[2]
        const quatA = quat.create()
        if (screenSpace)
            this.currentRotation = vec
        else
            vec3.add(this.currentRotation, this.currentRotation, vec)
        if (vec[0] !== 0)
            quat.rotateX(quatA, quatA, vec[0])
        if (vec[1] !== 0)
            quat.rotateY(quatA, quatA, vec[1])
        if (vec[2] !== 0)
            quat.rotateZ(quatA, quatA, vec[2])

        for (let i = 0; i < SIZE; i++) {
            const target = targets[i]
            if (target.lockedRotation)
                continue
            if (screenSpace) {
                quat.copy(target._rotationQuat, quatA)
                continue
            }

            const translated = vec3.sub([], target._translation, target.pivotPoint)
            vec3.add(target._translation, vec3.transformQuat([], translated, quatA), target.pivotPoint)

            if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.GLOBAL || SIZE > 1)
                quat.multiply(target._rotationQuat, quatA, target._rotationQuat)
            else
                quat.multiply(target._rotationQuat, target._rotationQuat, quatA)
            target.changed = true
        }
    }


    #testClick() {
        if (!GizmoSystem.mainEntity)
            return
        const mX = this.#rotateMatrix("x", this.xGizmo)
        const mY = this.#rotateMatrix("y", this.yGizmo)
        const mZ = this.#rotateMatrix("z", this.zGizmo)

        GizmoSystem.drawToDepthSampler(GizmoSystem.rotationGizmoMesh, [mX, mY, mZ])
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

    #rotateMatrix(axis, entity) {
        const matrix = entity.matrix.slice(0)
        matrix[12] += GizmoSystem.translation[0]
        matrix[13] += GizmoSystem.translation[1]
        matrix[14] += GizmoSystem.translation[2]

        if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.GLOBAL && axis !== undefined) {
            switch (axis) {
                case "x":
                    mat4.rotateY(matrix, matrix, -this.currentRotation[0])
                    break
                case "y":
                    mat4.rotateY(matrix, matrix, this.currentRotation[1])
                    break
                case "z":
                    mat4.rotateY(matrix, matrix, this.currentRotation[2])
                    break
                default:
                    break
            }
        } else if (axis !== undefined )
            return mat4.fromRotationTranslationScale([], quat.multiply([], GizmoSystem.targetRotation, entity._rotationQuat), GizmoSystem.translation, entity.scaling)

        return matrix
    }

    drawGizmo() {
        if (!GizmoSystem.mainEntity)
            return

        gpu.disable(gpu.CULL_FACE)
        const mX = this.#rotateMatrix("x", this.xGizmo)
        const mY = this.#rotateMatrix("y", this.yGizmo)
        const mZ = this.#rotateMatrix("z", this.zGizmo)

        if (this.tracking && GizmoSystem.clickedAxis === AXIS.X || !this.tracking)
            this.#draw(mX, AXIS.X, this.xGizmo.pickID)
        if (this.tracking && GizmoSystem.clickedAxis === AXIS.Y || !this.tracking)
            this.#draw(mY, AXIS.Y, this.yGizmo.pickID)
        if (this.tracking && GizmoSystem.clickedAxis === AXIS.Z || !this.tracking)
            this.#draw(mZ, AXIS.Z, this.zGizmo.pickID)
        gpu.enable(gpu.CULL_FACE)
    }

    #draw(transformMatrix, axis, id) {
        RotationGizmo.shader.bindForUse({
            viewMatrix: CameraAPI.viewMatrix,
            transformMatrix,
            projectionMatrix: CameraAPI.projectionMatrix,
            axis,
            translation: GizmoSystem.translation,
            camPos: CameraAPI.position,
            uID: [...id, 1],
            selectedAxis: GizmoSystem.clickedAxis,
            circleSampler: this.texture.texture,
            cameraIsOrthographic: CameraAPI.isOrthographic
        })
        GizmoSystem.rotationGizmoMesh.draw()
    }
}
