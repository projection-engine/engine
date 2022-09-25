import * as gizmoShaderCode from "../templates/GIZMO.glsl"

import {mat4, quat, vec3} from "gl-matrix"
import TRANSFORMATION_TYPE from "../../../../src/editor/data/TRANSFORMATION_TYPE"
import ConversionAPI from "../../production/apis/math/ConversionAPI"
import mapGizmoMesh from "../utils/map-gizmo-mesh"
import EngineStore from "../../../../src/editor/stores/EngineStore";
import PickingAPI from "../../production/apis/utils/PickingAPI";
import CameraAPI from "../../production/apis/CameraAPI";
import GizmoSystem from "../services/GizmoSystem";
import AXIS from "../data/AXIS";
import ScreenSpaceGizmo from "./ScreenSpaceGizmo";
import GPU from "../../production/GPU";
import STATIC_TEXTURES from "../../static/resources/STATIC_TEXTURES";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import {DepthPass} from "../../production";

const toDeg = 57.29, toRad = Math.PI / 180

export default class Rotation {
    tracking = false
    currentRotation = [0, 0, 0]
    gridSize = .1

    started = false
    currentIncrement = 0

    constructor() {
        this.gizmoShader = GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.ROTATION_GIZMO, gizmoShaderCode.vertexRot, gizmoShaderCode.fragmentRot)
        this.xGizmo = mapGizmoMesh("x", "ROTATION")
        this.yGizmo = mapGizmoMesh("y", "ROTATION")
        this.zGizmo = mapGizmoMesh("z", "ROTATION")
        this.texture = GPU.textures.get(STATIC_TEXTURES.ROTATION_GIZMO)
    }

    onMouseDown(event) {
        GizmoSystem.onMouseDown()
        this.x = event.clientX
        this.y = event.clientY

        this.currentIncrement = 0
        this.#testClick()
    }

    onMouseUp() {
        GizmoSystem.onMouseUp()
        if (GizmoSystem.totalMoved > 0) {
            GizmoSystem.totalMoved = 0
            EngineStore.saveEntity(
                GizmoSystem.mainEntity.id,
                undefined,
                "rotationQuaternion",
                GizmoSystem.mainEntity.rotationQuaternion
            )

        }
        document.exitPointerLock()

        this.started = false
        GizmoSystem.clickedAxis = -1
        this.tracking = false
        this.currentRotation = [0, 0, 0]
    }


    onMouseMove(event) {
        if (!this.started) {
            this.started = true
            EngineStore.saveEntity(
                GizmoSystem.mainEntity.id,
                undefined,
                "rotationQuaternion",
                GizmoSystem.mainEntity.rotationQuaternion
            )
        }

        const g = this.gridSize * toRad
        this.currentIncrement += event.movementX * .01
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
        GizmoSystem.notify([this.currentRotation[0] * toDeg, this.currentRotation[1] * toDeg, this.currentRotation[2] * toDeg])
    }

    rotateElement(vec, screenSpace) {
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

        const SIZE = GizmoSystem.selectedEntities.length
        for (let i = 0; i < SIZE; i++) {
            const target = GizmoSystem.selectedEntities[i]
            if (screenSpace) {
                quat.copy(target.rotationQuaternion, quatA)
                continue
            }
            if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.GLOBAL || SIZE > 1) {
                if (vec3.len(target.pivotPoint) > 0) {
                    const rotationMatrix = mat4.fromQuat([], quatA),
                        translated = vec3.sub([], target.translation, target.pivotPoint)
                    vec3.add(target.translation, vec3.transformMat4([], translated, rotationMatrix), target.pivotPoint)
                }
                quat.multiply(target.rotationQuaternion, quatA, target.rotationQuaternion)
            } else
                quat.multiply(target.rotationQuaternion, target.rotationQuaternion, quatA)
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
        } else if (axis !== undefined)
            return mat4.fromRotationTranslationScale([], quat.multiply([], GizmoSystem.targetRotation, entity.rotationQuaternion), GizmoSystem.translation, entity.scaling)

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
        this.gizmoShader.bindForUse({
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
