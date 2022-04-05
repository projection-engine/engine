import System from "../../ecs/basic/System";
import Shader from "../workers/Shader";
import * as gizmoShaderCode from "../../shaders/misc/gizmo.glsl";

import {mat4, quat, vec3} from "gl-matrix";
import Entity from "../../ecs/basic/Entity";
import TransformComponent from "../../ecs/components/TransformComponent";
import MeshInstance from "../../instances/MeshInstance";
import Transformation from "../workers/Transformation";
import PickComponent from "../../ecs/components/PickComponent";
import TextureInstance from "../../instances/TextureInstance";
import circle from "../../../../static/icons/circle.png";
import plane from "../../../../static/assets/Circle.json";
import ROTATION_TYPES from "../../templates/ROTATION_TYPES";
import COMPONENTS from "../../templates/COMPONENTS";

const toDeg = 57.29
export default class RotationGizmo extends System {
    eventStarted = false
    clickedAxis = -1
    tracking = false
    currentRotation = [0, 0, 0]

    constructor(gpu, renderTarget) {
        super([]);
        this.renderTarget = renderTarget
        this.gpu = gpu

        this.gizmoShader = new Shader(gizmoShaderCode.vertexRot, gizmoShaderCode.fragmentRot, gpu)
        this.xGizmo = this._mapEntity(2, 'x')
        this.yGizmo = this._mapEntity(3, 'y')
        this.zGizmo = this._mapEntity(4, 'z')


        this.xyz = new MeshInstance({
            gpu,
            vertices: plane.vertices,
            indices: plane.indices,
            normals: [],
            uvs: plane.uvs,
            tangents: [],
        })
        this.texture = new TextureInstance(circle, false, this.gpu)
        this.handlerListener = this.handler.bind(this)
    }


    _mapEntity(i, axis) {
        const e = new Entity(undefined)
        e.addComponent(new PickComponent(undefined, i - 3))
        e.addComponent(new TransformComponent())
        let s, t = [0, 0, 0], r
        switch (axis) {
            case 'x':
                s = [1.5, .1, 1.5]
                r = [0, 0, 1.57]
                break
            case 'y':
                s = [1.5, .1, 1.5]
                r = [0, 0, 0]
                break
            case 'z':
                s = [1.5, .1, 1.5]
                r = [1.57, 0, 0]
                break
            case 'c':
                s = [.1, .1, .1]
                t = [0, 0, 0]
                r = [0, 0, 0]
                break
            default:
                break
        }
        e.components[COMPONENTS.TRANSFORM].translation = t
        e.components[COMPONENTS.TRANSFORM].rotation = r
        e.components[COMPONENTS.TRANSFORM].transformationMatrix = Transformation.transform(t, r, s)

        return e
    }

    handler(event) {
        switch (event.type) {
            case 'mousedown':
                if (document.elementsFromPoint(event.clientX, event.clientY).includes(this.gpu.canvas)) {
                    const target = this.gpu.canvas.getBoundingClientRect()
                    this.currentCoord = {x: event.clientX - target.left, y: event.clientY - target.top}
                }

                break
            case 'mouseup':
                this.onGizmoEnd()
                this.started = false
                this.tracking = false
                this.clickedAxis = -1
                this.currentCoord = undefined
                this.gpu.canvas.removeEventListener("mousemove", this.handlerListener)
                document.exitPointerLock()
                this.renderTarget.style.display = 'none'

                this.currentRotation = [0, 0, 0]

                this.t = 0
                break
            case 'mousemove':
                if(!this.started) {
                    this.started = true
                    this.onGizmoStart()
                }

                const vector = [event.movementX, event.movementY, event.movementX]
                vec3.transformQuat(vector, vector, this.camera.orientation);

                switch (this.clickedAxis) {
                    case 1: // x
                        this.rotateElement([vector[0] * .01, 0, 0])
                        this.renderTarget.innerHTML = `${(this.currentRotation[0] * toDeg).toFixed(1)} θ`
                        break
                    case 2: // y
                        this.rotateElement([0, vector[1] * .01, 0])
                        this.renderTarget.innerHTML = `${(this.currentRotation[1] * toDeg).toFixed(1)} θ`
                        break
                    case 3: // z
                        this.rotateElement([0, 0, vector[2] * .01])
                        this.renderTarget.innerHTML = `${(this.currentRotation[2] * toDeg).toFixed(1)} θ`
                        break
                }

                break
            default:
                break
        }
    }

    rotateElement(vec, element = this.target.components.TransformComponent, type = this.typeRot, local = true) {
        let quatA = [0, 0, 0, 1]

        if (local)
            vec3.add(this.currentRotation, this.currentRotation, vec)


        if (vec[0] !== 0) {
            quat.rotateX(quatA, quatA, vec[0])
        }
        if (vec[1] !== 0) {
            quat.rotateY(quatA, quatA, vec[1])
        }
        if (vec[2] !== 0) {
            quat.rotateZ(quatA, quatA, vec[2])
        }


        if (type === ROTATION_TYPES.GLOBAL)
            element.rotationQuat = quat.multiply([], quatA, element.rotationQuat)
        else
            element.rotationQuat = quat.multiply([], element.rotationQuat, quatA)

    }


    execute(meshes, meshSources, selected, camera, pickSystem, lockCamera, entities, transformationType,
            onGizmoStart,
            onGizmoEnd) {
        super.execute()

        if (selected.length > 0) {
            this.typeRot = transformationType
            this.camera = camera
            this.onGizmoStart = onGizmoStart
            this.onGizmoEnd = onGizmoEnd
            if (this.currentCoord && !this.tracking) {
                const el = meshes.find(m => m.id === selected[0])
                if (el) {
                    const pickID = pickSystem.pickElement((shader, proj) => {
                        this._drawGizmo(el.components.TransformComponent.translation, el.components.TransformComponent.rotationQuat, camera.viewMatrix, proj, shader, true)
                    }, this.currentCoord, camera)

                    this.clickedAxis = pickID - 2

                    if (pickID === 0) {
                        lockCamera(false)
                        this.currentCoord = undefined
                    } else {
                        this.tracking = true
                        lockCamera(true)

                        this.renderTarget.style.left = this.currentCoord.x + 'px'
                        this.renderTarget.style.top = this.currentCoord.y + 'px'
                        this.renderTarget.style.display = 'block'

                        this.target = el
                        this.gpu.canvas.requestPointerLock()
                        this.gpu.canvas.addEventListener("mousemove", this.handlerListener)
                    }
                }
            }
            if (!this.eventStarted) {
                this.eventStarted = true
                this.gpu.canvas.addEventListener('mousedown', this.handlerListener)
                this.gpu.canvas.addEventListener('mouseup', this.handlerListener)
            }
            if (selected.length === 1) {
                const el = entities.find(m => m.id === selected[0])
                if (el && el.components[COMPONENTS.TRANSFORM])
                    this._drawGizmo(el.components[COMPONENTS.TRANSFORM].translation, el.components[COMPONENTS.TRANSFORM].rotationQuat, camera.viewMatrix, camera.projectionMatrix, this.gizmoShader)
            }
        }

    }

    _rotateMatrix(t, rotation, axis, m, comp) {
        let matrix

        if (this.typeRot === ROTATION_TYPES.GLOBAL && axis !== undefined) {
            matrix = [...m]
            matrix[12] += t[0]
            matrix[13] += t[1]
            matrix[14] += t[2]
            switch (axis) {
                case 'x':
                    mat4.rotateY(matrix, matrix, -this.currentRotation[0])
                    break
                case 'y':
                    mat4.rotateY(matrix, matrix, this.currentRotation[1])
                    break
                case 'z':
                    mat4.rotateY(matrix, matrix, this.currentRotation[2])
                    break
                default:
                    break
            }
        } else if(axis !== undefined)
            matrix = mat4.fromRotationTranslationScale([], quat.multiply([], rotation, comp.rotationQuat), t, comp.scaling)
        else{
            matrix = [...m]
            matrix[12] += t[0]
            matrix[13] += t[1]
            matrix[14] += t[2]
        }
        return matrix
    }

    _drawGizmo(translation, rotation, view, proj, shader) {
        this.gpu.clear(this.gpu.DEPTH_BUFFER_BIT)
        this.gpu.disable(this.gpu.CULL_FACE)

        const mX = this._rotateMatrix(translation, rotation, 'x', this.xGizmo.components.TransformComponent.transformationMatrix, this.xGizmo.components.TransformComponent)
        const mY = this._rotateMatrix(translation, rotation, 'y', this.yGizmo.components.TransformComponent.transformationMatrix, this.yGizmo.components.TransformComponent)
        const mZ = this._rotateMatrix(translation, rotation, 'z', this.zGizmo.components.TransformComponent.transformationMatrix, this.zGizmo.components.TransformComponent)

        shader.use()
        this.gpu.bindVertexArray(this.xyz.VAO)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, this.xyz.indexVBO)
        this.xyz.vertexVBO.enable()
        this.xyz.uvVBO.enable()

        if (this.tracking && this.clickedAxis === 1 || !this.tracking)
            this._draw(view, mX, proj, 1, this.xGizmo.components.PickComponent.pickID, shader)
        if (this.tracking && this.clickedAxis === 2 || !this.tracking)
            this._draw(view, mY, proj, 2, this.yGizmo.components.PickComponent.pickID, shader)
        if (this.tracking && this.clickedAxis === 3 || !this.tracking)
            this._draw(view, mZ, proj, 3, this.zGizmo.components.PickComponent.pickID, shader)

        this.xyz.vertexVBO.disable()
        this.gpu.bindVertexArray(null)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, null)
        this.gpu.enable(this.gpu.CULL_FACE)

    }

    _draw(view, t, proj, a, id, shader) {


        shader.bindForUse({
            viewMatrix: view,
            transformMatrix: t,
            projectionMatrix: proj,
            axis: a,
            selectedAxis: this.clickedAxis,
            uID: [...id, 1],
            circleSampler: this.texture.texture
        })
        this.gpu.drawElements(this.gpu.TRIANGLES, this.xyz.verticesQuantity, this.gpu.UNSIGNED_INT, 0)


    }
}
