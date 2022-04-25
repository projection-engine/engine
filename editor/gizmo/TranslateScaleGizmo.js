import System from "../../shared/ecs/basic/System";

import {mat4, quat, vec3, vec4} from "gl-matrix";
import Entity from "../../shared/ecs/basic/Entity";
import TransformComponent from "../../shared/ecs/components/TransformComponent";
import MeshInstance from "../../shared/instances/MeshInstance";
import Transformation from "../../shared/utils/workers/Transformation";
import PickComponent from "../../shared/ecs/components/PickComponent";
import arrow from '../assets/ScaleGizmo.json'
import COMPONENTS from "../../shared/templates/COMPONENTS";
import ROTATION_TYPES from "./ROTATION_TYPES";
import GizmoToolTip from "./GizmoToolTip";

export default class TranslateScaleGizmo extends System {
    target = []
    clickedAxis = -1
    tracking = false
    rotationTarget = [0, 0, 0, 1]

    distanceX = 0
    distanceY = 0
    distanceZ = 0

    constructor(gpu, gizmoShader, renderTarget) {
        super([]);
        this.renderTarget = new GizmoToolTip(renderTarget)
        this.gpu = gpu
        this.gizmoShader = gizmoShader
    }

    handler(event) {
        switch (event.type) {
            case 'mousedown':
                if (document.elementsFromPoint(event.clientX, event.clientY).includes(this.gpu.canvas) && !this.firstPick) {
                    const target = this.gpu.canvas.getBoundingClientRect()
                    this.currentCoord = {x: event.clientX - target.left, y: event.clientY - target.top}
                }
                if (this.firstPick)
                    this.firstPick = false
                break
            case 'mouseup':
                this.firstPick = true
                if (this.tracking) {
                    this.renderTarget.stop()
                    this.onGizmoEnd()
                    this.tracking = false
                    this.started = false
                    this.distanceX = 0
                    this.distanceY = 0
                    this.distanceZ = 0
                    this.currentCoord = undefined
                    this.gpu.canvas.removeEventListener("mousemove", this.handlerListener)
                    document.exitPointerLock()

                    this.clickedAxis = -1
                    this.t = 0
                }
                break
            default:
                break
        }
    }
    transformElement(){}
    getTranslation(el) {
        const k = Object.keys(el.components)
        let key

        for (let i = 0; i < k.length; i++) {
            switch (k[i]) {
                case COMPONENTS.SKYLIGHT:
                case COMPONENTS.DIRECTIONAL_LIGHT:
                    key = k[i] === COMPONENTS.SKYLIGHT ? 'SkylightComponent' : 'DirectionalLightComponent'
                    return el.components[key].direction
                case COMPONENTS.TRANSFORM:

                    return el.components[COMPONENTS.TRANSFORM]?.translation
                default:
                    break
            }
        }
    }
    execute(
        meshes,
        meshSources,
        selected,
        camera,
        pickSystem,
        lockCamera,
        entities,
        transformationType,
        onGizmoStart,
        onGizmoEnd,
        gridSize,
        arrow
    ) {
        super.execute()

        if (selected.length > 0) {
            const el = entities[selected[0]]
            this.gridSize = gridSize
            this.firstPick = false
            this.camera = camera
            this.typeRot = transformationType
            this.onGizmoStart = onGizmoStart
            this.onGizmoEnd = onGizmoEnd
            if (this.currentCoord && !this.tracking) {
                const translation = this.getTranslation(el)
                if (translation !== undefined) {
                    const pickID = pickSystem.pickElement((shader, proj) => {
                        this._drawGizmo(translation, camera.viewMatrix, proj, shader, arrow)
                    }, this.currentCoord, camera, true)

                    this.clickedAxis = pickID - 2

                    if (pickID === 0) {
                        lockCamera(false)
                        this.currentCoord = undefined
                    } else {
                        this.tracking = true
                        lockCamera(true)
                        this.target = selected.map(e => entities[e])
                        this.gpu.canvas.requestPointerLock()
                        this.gpu.canvas.addEventListener("mousemove", this.handlerListener)
                    }
                }
            }
            this.rotationTarget = el.components[COMPONENTS.TRANSFORM] !== undefined ? el.components[COMPONENTS.TRANSFORM].rotationQuat : [0, 0, 0, 1]
            this._drawGizmo(el.components[COMPONENTS.TRANSFORM].translation, camera.viewMatrix, camera.projectionMatrix, this.gizmoShader, arrow)
        }

    }

    _translateMatrix(t, m, comp) {
        const matrix = [...m]

        if (this.typeRot === ROTATION_TYPES.RELATIVE) {
            mat4.fromRotationTranslationScaleOrigin(matrix, quat.multiply([], this.rotationTarget, comp.rotationQuat), vec3.add([], t, comp.translation), comp.scaling, comp.translation)
        } else {
            matrix[12] += t[0]
            matrix[13] += t[1]
            matrix[14] += t[2]
        }

        return matrix
    }

    _drawGizmo(translation, view, proj, shader, arrow) {
        const mX = this._translateMatrix(translation, this.xGizmo.components[COMPONENTS.TRANSFORM].transformationMatrix, this.xGizmo.components[COMPONENTS.TRANSFORM])
        const mY = this._translateMatrix(translation, this.yGizmo.components[COMPONENTS.TRANSFORM].transformationMatrix, this.yGizmo.components[COMPONENTS.TRANSFORM])
        const mZ = this._translateMatrix(translation, this.zGizmo.components[COMPONENTS.TRANSFORM].transformationMatrix, this.zGizmo.components[COMPONENTS.TRANSFORM])

        shader.use()
        this.gpu.bindVertexArray(arrow.VAO)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, arrow.indexVBO)
        arrow.vertexVBO.enable()

        if (this.tracking && this.clickedAxis === 1 || !this.tracking)
            this._draw(view, mX, proj, 1, this.xGizmo.components.PickComponent.pickID, shader, translation, arrow)
        if (this.tracking && this.clickedAxis === 2 || !this.tracking)
            this._draw(view, mY, proj, 2, this.yGizmo.components.PickComponent.pickID, shader, translation, arrow)
        if (this.tracking && this.clickedAxis === 3 || !this.tracking)
            this._draw(view, mZ, proj, 3, this.zGizmo.components.PickComponent.pickID, shader, translation, arrow)

        arrow.vertexVBO.disable()
        this.gpu.bindVertexArray(null)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, null)


    }

    _draw(view, t, proj, a, id, shader, tt, arrow) {
        shader.bindForUse({
            viewMatrix: view,
            transformMatrix: t,
            projectionMatrix: proj,
            camPos: this.camera.position,
            translation: tt,
            axis: a,
            selectedAxis: this.clickedAxis,
            uID: [...id, 1],
        })
        this.gpu.drawElements(this.gpu.TRIANGLES, arrow.verticesQuantity, this.gpu.UNSIGNED_INT, 0)
    }
}
