import ShaderInstance from "../../../production/libs/instances/ShaderInstance"
import * as gizmoShaderCode from "../../templates/GIZMO.glsl"

import {mat4, quat, vec3} from "gl-matrix"
import TextureInstance from "../../../production/libs/instances/TextureInstance"
import circle from "../../../../../data/icons/circle.png"
import TRANSFORMATION_TYPE from "../../../../../data/misc/TRANSFORMATION_TYPE"
import Conversion from "../../../production/services/Conversion"
import mapEntity from "./utils/map-entity"
import RendererStoreController from "../../../../../stores/RendererStoreController";
import ViewportPicker from "../../../production/services/ViewportPicker";
import CameraAPI from "../../../production/libs/apis/CameraAPI";
import GizmoSystem from "../../services/GizmoSystem";
import AXIS from "../../data/AXIS";
import ScreenSpaceGizmo from "./ScreenSpaceGizmo";

const CSS = {
    backdropFilter: "blur(10px) brightness(70%)",
    borderRadius: "5px",
    width: "fit-content",
    height: "fit-content",
    position: "absolute",
    top: "4px",
    left: "4px",
    zIndex: "10",
    color: "white",
    padding: "8px",
    fontSize: ".75rem",
    display: "none"
}
const toDeg = 57.29, toRad = Math.PI / 180
export default class Rotation {
    tracking = false
    currentRotation = [0, 0, 0]
    gridSize = .1
    distanceX = 0
    distanceY = 0
    distanceZ = 0
    started = false

    constructor() {

        const targetID = gpu.canvas.id + "-gizmo"
        if (document.getElementById(targetID) !== null)
            this.renderTarget = document.getElementById(targetID)
        else {
            this.renderTarget = document.createElement("div")
            this.renderTarget.id = targetID
            Object.assign(this.renderTarget.style, CSS)
            document.body.appendChild(this.renderTarget)
        }

        this.gizmoShader = new ShaderInstance(gizmoShaderCode.vertexRot, gizmoShaderCode.fragmentRot)
        this.xGizmo = mapEntity("x", "ROTATION")
        this.yGizmo = mapEntity("y", "ROTATION")
        this.zGizmo = mapEntity("z", "ROTATION")
        this.texture = new TextureInstance(circle, false)
    }

    onMouseDown(event) {

        const w = gpu.canvas.width, h = gpu.canvas.height
        const x = event.clientX
        const y = event.clientY

        this.currentCoord = Conversion.toQuadCoord({x, y}, {w, h})
        this.currentCoord.clientX = x
        this.currentCoord.clientY = y

        ScreenSpaceGizmo.onMouseDown(event)
        this.#testClick()


    }

    onMouseUp() {
        if (GizmoSystem.clickedAxis === AXIS.SCREEN_SPACE)
            ScreenSpaceGizmo.onMouseUp()

        if (GizmoSystem.totalMoved > 0) {
            GizmoSystem.totalMoved = 0
            RendererStoreController.saveEntity(
                GizmoSystem.mainEntity.id,
                undefined,
                "rotationQuaternion",
                GizmoSystem.mainEntity.rotationQuaternion
            )

        }
        document.exitPointerLock()

        this.started = false
        this.distanceX = 0
        this.distanceY = 0
        this.distanceZ = 0
        GizmoSystem.clickedAxis = -1
        this.tracking = false
        this.currentRotation = [0, 0, 0]
        this.renderTarget.innerText = ""
        this.renderTarget.style.display = "none"
    }


    onMouseMove(event) {
        if (!this.started) {
            this.started = true
            RendererStoreController.saveEntity(
                GizmoSystem.mainEntity.id,
                undefined,
                "rotationQuaternion",
                GizmoSystem.mainEntity.rotationQuaternion
            )
        }

        switch (GizmoSystem.clickedAxis) {
            case AXIS.X:
                this.distanceX += Math.abs(event.movementX * 0.05)

                if (Math.abs(this.distanceX) >= this.gridSize) {
                    this.rotateElement([Math.sign(event.movementX) * this.gridSize * toRad, 0, 0])
                    this.distanceX = 0
                    this.renderTarget.innerText = `${(this.currentRotation[0] * toDeg).toFixed(1)} θ`
                }
                break
            case AXIS.Y:
                this.distanceY += Math.abs(event.movementX * 0.05)
                if (Math.abs(this.distanceY) >= this.gridSize) {
                    this.rotateElement([0, Math.sign(event.movementX) * this.gridSize * toRad, 0])
                    this.renderTarget.innerText = `${(this.currentRotation[1] * toDeg).toFixed(1)} θ`
                    this.distanceY = 0
                }
                break
            case AXIS.Z:
                this.distanceZ += Math.abs(event.movementX * 0.05)
                if (Math.abs(this.distanceZ) >= this.gridSize) {
                    this.rotateElement([0, 0, Math.sign(event.movementX) * this.gridSize * toRad])

                    this.distanceZ = 0
                    this.renderTarget.innerText = `${(this.currentRotation[2] * toDeg).toFixed(1)} θ`
                }
                break
            case AXIS.SCREEN_SPACE:
                const position = ScreenSpaceGizmo.onMouseMove(event)
                this.rotateElement(vec3.scale([], position, toRad), true)
                const getRot = (r) => `${(r * toDeg).toFixed(1)} θ; `
                this.renderTarget.innerText = getRot(this.currentRotation[0]) + getRot(this.currentRotation[1]) + getRot(this.currentRotation[2])
                break
            default:
                break
        }
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
                target.rotationQuaternion = quatA
                continue
            }
            if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.GLOBAL || SIZE > 1) {
                if (vec3.len(target.pivotPoint) > 0) {
                    const rotationMatrix = mat4.fromQuat([], quatA),
                        translated = vec3.sub([], target.translation, target.pivotPoint)
                    target.translation = vec3.add([], vec3.transformMat4([], translated, rotationMatrix), target.pivotPoint)
                }
                target.rotationQuaternion = quat.multiply([], quatA, target.rotationQuaternion)
            } else
                target.rotationQuaternion = quat.multiply([], target.rotationQuaternion, quatA)
        }
    }


    #testClick() {
        if(!GizmoSystem.mainEntity || GizmoSystem.mainEntity?.lockedRotation)
            return
        const mX = this.#rotateMatrix("x", this.xGizmo)
        const mY = this.#rotateMatrix("y", this.yGizmo)
        const mZ = this.#rotateMatrix("z", this.zGizmo)

        const FBO = GizmoSystem.drawToDepthSampler(GizmoSystem.rotationGizmoMesh, [mX, mY, mZ])
        const dd = ViewportPicker.depthPick(FBO, this.currentCoord)
        const pickID = Math.round(255 * dd[0])
        GizmoSystem.clickedAxis = pickID

        if (pickID === 0)
            this.onMouseUp(true)
        else {
            GizmoSystem.wasOnGizmo = true
            this.tracking = true

            this.renderTarget.style.left = this.currentCoord.clientX + "px"
            this.renderTarget.style.top = this.currentCoord.clientY + "px"
            this.renderTarget.style.display = "block"
            this.renderTarget.style.width = "fit-content"
            this.renderTarget.innerText = "0 θ"

            gpu.canvas.requestPointerLock()
        }
    }

    #rotateMatrix(axis, entity) {
        const matrix = entity.transformationMatrix.slice(0)
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
        if(GizmoSystem.mainEntity.lockedRotation)
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
