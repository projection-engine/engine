import System from "../../ecs/basic/System";
import Shader from "../workers/Shader";
import * as gizmoShaderCode from "../../shaders/misc/gizmo.glsl";

import {vec3} from "gl-matrix";
import Entity from "../../ecs/basic/Entity";
import TransformComponent from "../../ecs/components/TransformComponent";
import MeshInstance from "../../instances/MeshInstance";
import Transformation from "../workers/Transformation";
import PickComponent from "../../ecs/components/PickComponent";
import arrow from '../../../../static/assets/ScaleGizmo.json'
import cube from '../../../../static/assets/Cube.json'
import COMPONENTS from "../../templates/COMPONENTS";

export default class ScaleGizmo extends System {
    eventStarted = false
    clickedAxis = -1
    tracking = false

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.gizmoShader = new Shader(gizmoShaderCode.vertex, gizmoShaderCode.fragment, gpu)

        this.xGizmo = this._mapEntity(2, 'x')
        this.yGizmo = this._mapEntity(3, 'y')
        this.zGizmo = this._mapEntity(4, 'z')
        this.centerGizmo = this._mapEntity(1, 'c')

        this.xyz = new MeshInstance({
            gpu,
            vertices: arrow.vertices,
            indices: arrow.indices,
            normals: arrow.normals,
            uvs: [],
            tangents: []
        })

        this.center = new MeshInstance({
            gpu,
            vertices: cube.vertices,
            indices: cube.indices,
            normals: cube.normals,
            uvs: [],
            tangents: [],
        })
        this.handlerListener = this.handler.bind(this)
    }

    _mapEntity(i, axis) {
        const e = new Entity(undefined)
        e.addComponent(new PickComponent(undefined, i - 3))
        e.addComponent(new TransformComponent())
        let s = [.2, 0.2, 0.2], t, r
        switch (axis) {
            case 'x':

                t = [1.5, 0, 0]
                r = [0, 1.57, 0]
                break
            case 'y':

                t = [0, 1.5, 0]
                r = [-1.57, 1.57, 0]
                break
            case 'z':

                t = [0, 0, 1.5]
                r = [3.1415, -3.1415, 3.1415]
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
                this.onGizmoChange()
                this.tracking = false
                this.currentCoord = undefined
                this.gpu.canvas.removeEventListener("mousemove", this.handlerListener)
                document.exitPointerLock()
                this.clickedAxis = -1
                this.t = 0
                break
            case 'mousemove':
                const vector = [event.movementX, event.movementY, event.movementX]
                vec3.transformQuat(vector, vector, this.camera.orientation);

                switch (this.clickedAxis) {
                    case 1: // x
                        this.transformElement([vector[0] * .01, 0, 0])
                        break
                    case 2: // y
                        this.transformElement([0, vector[1] * .01, 0])

                        break
                    case 3: // z
                        this.transformElement([0, 0, vector[2] * .01])
                        break
                }

                break
            default:
                break
        }
    }

    transformElement(vec) {
        this.target.components.TransformComponent.scaling = [
            this.target.components.TransformComponent.scaling[0] - vec[0],
            this.target.components.TransformComponent.scaling[1] - vec[1],
            this.target.components.TransformComponent.scaling[2] - vec[2]
        ]
    }


    execute(meshes, meshSources, selected, camera, pickSystem,  lockCamera, entities, onGizmoChange) {
        super.execute()

        if (selected.length > 0) {
            this.camera = camera
            this.onGizmoChange = onGizmoChange
            if (this.currentCoord && !this.tracking) {
                const el = meshes.find(m => m.id === selected[0])
                if(el){
                    const pickID = pickSystem.pickElement((shader, proj) => {
                        this._drawGizmo(el.components.TransformComponent.translation, camera.viewMatrix, proj, shader, true)
                    }, this.currentCoord, camera)

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
            if (!this.eventStarted) {
                this.eventStarted = true
                this.gpu.canvas.addEventListener('mousedown', this.handlerListener)
                this.gpu.canvas.addEventListener('mouseup', this.handlerListener)
            }

            if(selected.length === 1){
                const el = meshes.find(m => m.id === selected[0])
                if (el) {
                    if (selected.length === 1)
                        this._drawGizmo(el.components.TransformComponent.translation, camera.viewMatrix, camera.projectionMatrix, this.gizmoShader)

                }
            }

        }

    }

    _translateMatrix(t, m) {
        const matrix = [...m]
        matrix[12] += t[0]
        matrix[13] += t[1]
        matrix[14] += t[2]

        return matrix
    }

    _drawGizmo(translation, view, proj, shader, pick) {

        const mX = this._translateMatrix(translation, this.xGizmo.components.TransformComponent.transformationMatrix)
        const mY = this._translateMatrix(translation, this.yGizmo.components.TransformComponent.transformationMatrix)
        const mZ = this._translateMatrix(translation, this.zGizmo.components.TransformComponent.transformationMatrix)
        const mC = this._translateMatrix(translation, this.centerGizmo.components.TransformComponent.transformationMatrix)


        shader.use()
        this.gpu.bindVertexArray(this.xyz.VAO)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, this.xyz.indexVBO)
        this.xyz.vertexVBO.enable()

        if (this.tracking && this.clickedAxis === 1 || !this.tracking)
            this._draw(view, mX, proj, 1, this.xGizmo.components.PickComponent.pickID, shader)
        if (this.tracking && this.clickedAxis === 2 || !this.tracking)
            this._draw(view, mY, proj, 2, this.yGizmo.components.PickComponent.pickID, shader)
        if (this.tracking && this.clickedAxis === 3 || !this.tracking)
            this._draw(view, mZ, proj, 3, this.zGizmo.components.PickComponent.pickID, shader)

        this.xyz.vertexVBO.disable()
        this.gpu.bindVertexArray(null)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, null)


        this.gpu.bindVertexArray(this.center.VAO)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, this.center.indexVBO)
        this.center.vertexVBO.enable()


        if (!pick)
            this._draw(view, mC, proj, 0, this.centerGizmo.components.PickComponent.pickID, shader)

        this.center.vertexVBO.disable()
        this.gpu.bindVertexArray(null)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, null)


    }

    _draw(view, t, proj, a, id, shader) {


        shader.bindForUse({
            viewMatrix: view,
            transformMatrix: t,
            projectionMatrix: proj,
            axis: a,
            selectedAxis: this.clickedAxis,
            uID: [...id, 1],
        })
        this.gpu.drawElements(this.gpu.TRIANGLES, this.xyz.verticesQuantity, this.gpu.UNSIGNED_INT, 0)


    }
}
