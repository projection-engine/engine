import System from "../../ecs/basic/System";

import {mat4, quat, vec3} from "gl-matrix";
import COMPONENTS from "../../templates/COMPONENTS";
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

    transformElement() {
    }

    getTranslation(el) {
        const k = Object.keys(el.components)
        for (let i = 0; i < k.length; i++) {
            switch (k[i]) {
                case COMPONENTS.SKYLIGHT:
                case COMPONENTS.DIRECTIONAL_LIGHT:
                    return {
                        valid: true,
                        data: el.components[k[i]].direction
                    }
                case COMPONENTS.TRANSFORM:
                    return {
                        valid: true,
                        data: el.components[COMPONENTS.TRANSFORM]?.translation
                    }
                default:
                    break
            }
        }
        return {
            valid: false,
            data: [0,0,0]
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
            const parent = el ? entities[el.linkedTo] : undefined
            const currentTranslation = this.getTranslation(el),
                parentTranslation = parent ? this.getTranslation(parent) : {data: [0, 0, 0]},
                translation = currentTranslation.valid ? [
                    currentTranslation.data[0] + parentTranslation.data[0],
                    currentTranslation.data[1] + parentTranslation.data[1],
                    currentTranslation.data[2] + parentTranslation.data[2]
                ] : undefined
            if (translation) {
                this.gridSize = gridSize
                this.firstPick = false
                this.camera = camera
                this.typeRot = transformationType
                this.onGizmoStart = onGizmoStart
                this.onGizmoEnd = onGizmoEnd
                if (this.currentCoord && !this.tracking) {

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
                const t = el.components[COMPONENTS.TRANSFORM]

                this.rotationTarget = t !== undefined ? t.rotationQuat : [0, 0, 0, 1]

                this._drawGizmo(translation, camera.viewMatrix, camera.projectionMatrix, this.gizmoShader, arrow)
            }
        }

    }

    _translateMatrix(t, components) {
        const comp = components[COMPONENTS.TRANSFORM]
        const matrix = comp ? [...comp.transformationMatrix] : this.getLightData('transformationMatrix', components)

        const translation = comp ? comp.translation : this.getLightData('direction', components),
            rotationQuat = comp ? comp.rotationQuat : [0, 0, 0, 1],
            scale = comp ? comp.scaling : [1, 1, 1]
        if (this.typeRot === ROTATION_TYPES.RELATIVE) {
            mat4.fromRotationTranslationScaleOrigin(matrix, quat.multiply([], this.rotationTarget, rotationQuat), vec3.add([], t, translation), scale, translation)
        } else {
            matrix[12] += t[0]
            matrix[13] += t[1]
            matrix[14] += t[2]
        }

        return matrix
    }

    getLightData(key, components) {
        return components[COMPONENTS.DIRECTIONAL_LIGHT] ? components[COMPONENTS.DIRECTIONAL_LIGHT][key] : components[COMPONENTS.SKYLIGHT][key]
    }

    _drawGizmo(translation, view, proj, shader, arrow) {

        const mX = this._translateMatrix(translation, this.xGizmo.components)
        const mY = this._translateMatrix(translation, this.yGizmo.components)
        const mZ = this._translateMatrix(translation, this.zGizmo.components)

        shader.use()
        this.gpu.bindVertexArray(arrow.VAO)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, arrow.indexVBO)
        arrow.vertexVBO.enable()

        if (this.tracking && this.clickedAxis === 1 || !this.tracking)
            this._draw(view, mX, proj, 1, this.xGizmo.components[COMPONENTS.PICK].pickID, shader, translation, arrow)
        if (this.tracking && this.clickedAxis === 2 || !this.tracking)
            this._draw(view, mY, proj, 2, this.yGizmo.components[COMPONENTS.PICK].pickID, shader, translation, arrow)
        if (this.tracking && this.clickedAxis === 3 || !this.tracking)
            this._draw(view, mZ, proj, 3, this.zGizmo.components[COMPONENTS.PICK].pickID, shader, translation, arrow)

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
