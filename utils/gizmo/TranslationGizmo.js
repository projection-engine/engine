import System from "../../ecs/basic/System";
import Shader from "../workers/Shader";
import * as gizmoShaderCode from "../../shaders/misc/gizmo.glsl";

import {mat4, quat, vec3, vec4} from "gl-matrix";
import Entity from "../../ecs/basic/Entity";
import TransformComponent from "../../ecs/components/TransformComponent";
import MeshInstance from "../../instances/MeshInstance";
import Transformation from "../workers/Transformation";
import PickComponent from "../../ecs/components/PickComponent";
import COMPONENTS from "../../templates/COMPONENTS";
import arrow from '../../../../static/assets/Arrow.json'
import cube from '../../../../static/assets/Cube.json'
import ROTATION_TYPES from "../../templates/ROTATION_TYPES";
import lockToGrid from "../misc/lockToGrid";

export default class TranslationGizmo extends System {

    clickedAxis = -1
    tracking = false
    rotationTarget = [0, 0, 0, 1]
    currentCoord = undefined
    firstPick = true
    gridSize = .01
    distanceX = 0
    distanceY = 0
    distanceZ = 0
    constructor(gpu, gizmoShader) {
        super([]);
        this.gpu = gpu

        this.gizmoShader = gizmoShader

        this.xGizmo = this._mapEntity(2, 'x')
        this.yGizmo = this._mapEntity(3, 'y')
        this.zGizmo = this._mapEntity(4, 'z')

        this.xyz = new MeshInstance({
            gpu,
            vertices: arrow.vertices,
            indices: arrow.indices,
            normals: arrow.normals,
            uvs: [],
            tangents: []
        })

        this.handlerListener = this.handler.bind(this)
        this.gpu.canvas.addEventListener('mouseup', this.handlerListener)
        this.gpu.canvas.addEventListener('mousedown', this.handlerListener)
    }

    _mapEntity(i, axis) {
        const e = new Entity(undefined)
        e.addComponent(new PickComponent(undefined, i - 3))
        e.addComponent(new TransformComponent())
        let s, t = [0, 0, 0], r
        switch (axis) {
            case 'x':
                s = [.75, 0.05, 0.05]
                r = [0, 0, 0]
                break
            case 'y':
                s = [.75, 0.05, 0.05]
                r = [0, 0, 1.57]
                break
            case 'z':
                s = [.75, 0.05, 0.05]
                r = [3.141592653589793, -1.57, 3.141592653589793]
                break
            case 'c':
                s = [.1, .1, .1]
                r = [0, 0, 0]
                break
            default:
                break
        }
        e.components[COMPONENTS.TRANSFORM].translation = t
        e.components[COMPONENTS.TRANSFORM].rotation = r
        e.components[COMPONENTS.TRANSFORM].scaling = s

        e.components[COMPONENTS.TRANSFORM].transformationMatrix = Transformation.transform(t, e.components[COMPONENTS.TRANSFORM].rotationQuat, s)

        return e
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
                    this.onGizmoEnd()

                    this.tracking = false
                    this.started = false
                    this.clickedAxis = -1
                    this.currentCoord = undefined
                    this.distanceX = 0
                    this.distanceY = 0
                    this.distanceZ = 0
                    this.gpu.canvas.removeEventListener("mousemove", this.handlerListener)
                    document.exitPointerLock()
                    this.t = 0
                }
                break
            case 'mousemove':
                if (!this.started) {
                    this.started = true
                    this.onGizmoStart()
                }
                const vector = [event.movementX, event.movementY, event.movementX]
                vec3.transformQuat(vector, vector, this.camera.orientation);

                switch (this.clickedAxis) {
                    case 1: // x
                        this.distanceX += Math.abs(vector[0] * 0.1)
                        if (Math.abs(this.distanceX) >= this.gridSize) {
                            this.transformElement([Math.sign(vector[0]) * this.distanceX, 0, 0])
                            this.distanceX = 0
                        }
                        break
                    case 2: // y
                        this.distanceY += Math.abs(vector[1] * 0.1)
                        if (Math.abs(this.distanceY) >= this.gridSize) {
                        this.transformElement([0, Math.sign(vector[1]) * this.distanceY, 0])
                            this.distanceY = 0
                        }
                        break
                    case 3: // z
                            this.distanceZ += Math.abs(vector[2] * 0.1)
                            if (Math.abs(this.distanceZ) >= this.gridSize) {

                                this.transformElement([0, 0, Math.sign(vector[2]) * this.distanceZ])
                                this.distanceZ = 0
                            }
                        break
                }

                break
            default:
                break
        }
    }

    transformElement(vec) {
        let toApply
        if (this.typeRot === ROTATION_TYPES.GLOBAL || !this.target.components[COMPONENTS.TRANSFORM])
            toApply = vec
        else
            toApply = vec4.transformQuat([], vec, this.target.components[COMPONENTS.TRANSFORM].rotationQuat)

        const k = Object.keys(this.target.components)
        let key
        for (let i = 0; i < k.length; i++) {
            switch (k[i]) {
                case COMPONENTS.SKYLIGHT:
                case COMPONENTS.DIRECTIONAL_LIGHT:
                    key = k[i] === COMPONENTS.SKYLIGHT ? 'SkylightComponent' : 'DirectionalLightComponent'
                    this.target.components[key].direction = [
                        this.target.components[key].direction[0] - toApply[0],
                        this.target.components[key].direction[1] - toApply[1],
                        this.target.components[key].direction[2] - toApply[2]
                    ]
                    break
                case COMPONENTS.TRANSFORM:
                    this.target.components[COMPONENTS.TRANSFORM].translation = [
                        this.target.components[COMPONENTS.TRANSFORM].translation[0] - toApply[0],
                        this.target.components[COMPONENTS.TRANSFORM].translation[1] - toApply[1],
                        this.target.components[COMPONENTS.TRANSFORM].translation[2] - toApply[2]
                    ]
                    break
                default:
                    break
            }
        }
    }

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
        gridSize
        ) {

        super.execute()
        if (selected.length > 0) {
            this.gridSize = gridSize
            this.firstPick = false
            this.typeRot = transformationType
            this.camera = camera
            this.onGizmoStart = onGizmoStart
            this.onGizmoEnd = onGizmoEnd
            if (this.currentCoord && !this.tracking) {
                const el = entities.find(m => m.id === selected[0])
                if (el !== undefined) {
                    const translation = this.getTranslation(el)
                    if (translation !== undefined) {

                        const pickID = pickSystem.pickElement((shader, proj) => {
                            this._drawGizmo(translation, camera.viewMatrix, proj, shader, true)
                        }, this.currentCoord, camera, true)

                        this.clickedAxis = pickID - 2

                        if (pickID === 0) {
                            lockCamera(false)
                            this.currentCoord = undefined
                        } else {
                            this.tracking = true
                            lockCamera(true)
                            this.target = el

                            this.gpu.canvas.requestPointerLock()
                            this.gpu.canvas.addEventListener("mousemove", this.handlerListener)
                        }
                    }
                }
            }


            if (selected.length === 1) {
                const el = entities.find(m => m.id === selected[0])
                if (el) {
                    const translation = this.getTranslation(el)
                    if (translation) {
                        this.rotationTarget = el.components[COMPONENTS.TRANSFORM] !== undefined ? el.components[COMPONENTS.TRANSFORM].rotationQuat : [0, 0, 0, 1]
                        this._drawGizmo(translation, camera.viewMatrix, camera.projectionMatrix, this.gizmoShader)
                    }
                }
            }
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

    _drawGizmo(translation, view, proj, shader) {

        const mX = this._translateMatrix(translation, this.xGizmo.components[COMPONENTS.TRANSFORM].transformationMatrix, this.xGizmo.components[COMPONENTS.TRANSFORM])
        const mY = this._translateMatrix(translation, this.yGizmo.components[COMPONENTS.TRANSFORM].transformationMatrix, this.yGizmo.components[COMPONENTS.TRANSFORM])
        const mZ = this._translateMatrix(translation, this.zGizmo.components[COMPONENTS.TRANSFORM].transformationMatrix, this.zGizmo.components[COMPONENTS.TRANSFORM])

        shader.use()
        this.gpu.bindVertexArray(this.xyz.VAO)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, this.xyz.indexVBO)
        this.xyz.vertexVBO.enable()

        if (this.tracking && this.clickedAxis === 1 || !this.tracking)
            this._draw(view, mX, proj, 1, this.xGizmo.components.PickComponent.pickID, shader, translation)
        if (this.tracking && this.clickedAxis === 2 || !this.tracking)

            this._draw(view, mY, proj, 2, this.yGizmo.components.PickComponent.pickID, shader, translation)
        if (this.tracking && this.clickedAxis === 3 || !this.tracking)
            this._draw(view, mZ, proj, 3, this.zGizmo.components.PickComponent.pickID, shader, translation)

        this.xyz.vertexVBO.disable()
        this.gpu.bindVertexArray(null)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, null)


    }

    _draw(view, t, proj, a, id, shader, tt) {

        shader.bindForUse({
            viewMatrix: view,
            transformMatrix: t,
            projectionMatrix: proj,

            translation: tt,
            camPos: this.camera.position,

            axis: a,
            selectedAxis: this.clickedAxis,
            uID: [...id, 1],
        })
        this.gpu.drawElements(this.gpu.TRIANGLES, this.xyz.verticesQuantity, this.gpu.UNSIGNED_INT, 0)


    }
}
