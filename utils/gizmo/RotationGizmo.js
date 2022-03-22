import System from "../../ecs/basic/System";
import MeshSystem from "../../ecs/systems/MeshSystem";
import Shader from "../workers/Shader";
import * as shaderCode from "../../shaders/mesh/meshSelected.glsl";
import * as gizmoShaderCode from "../../shaders/misc/gizmo.glsl";

import {mat4, vec3} from "gl-matrix";
import Entity from "../../ecs/basic/Entity";
import TransformComponent from "../../ecs/components/TransformComponent";
import MeshInstance from "../../instances/MeshInstance";
import Transformation from "../workers/Transformation";
import PickComponent from "../../ecs/components/PickComponent";
import COMPONENTS from "../../../utils/misc/COMPONENTS";
import TextureInstance from "../../instances/TextureInstance";
import circle from "../../../../static/icons/circle.png";
import plane from "../../../../static/assets/Circle.json";
const toDeg = 57.29
export default class RotationGizmo extends System {
    eventStarted = false
    clickedAxis = -1
    tracking = false

    constructor(gpu, renderTarget) {
        super([]);
        this.renderTarget = renderTarget
        this.gpu = gpu
        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.gizmoShader = new Shader(gizmoShaderCode.vertexRot, gizmoShaderCode.fragmentRot, gpu)
        this.xGizmo = this._mapEntity(2, 'x')
        this.yGizmo = this._mapEntity(3, 'y')
        this.zGizmo = this._mapEntity(4, 'z')
        this.centerGizmo = this._mapEntity(1, 'c')

        this.xyz = new MeshInstance({
            gpu,
            vertices: plane.vertices,
            indices: plane.indices,
            normals: plane.normals,
            uvs: plane.uvs,
            tangents: plane.tangents,
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
                r = [0,0,0]
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
        e.components.TransformComponent.translation = t
        e.components.TransformComponent.rotation = r
        e.components.TransformComponent.transformationMatrix = Transformation.transform(t, r, s)

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

                this.tracking = false
                this.clickedAxis = -1
                this.currentCoord = undefined
                document.removeEventListener("mousemove", this.handlerListener)
                document.exitPointerLock()
                this.renderTarget.style.display = 'none'

                this.t = 0
                break
            case 'mousemove':
                const vector = [event.movementX, event.movementY, event.movementX]
                vec3.transformQuat(vector, vector, this.camera.orientation);

                switch (this.clickedAxis) {
                    case 1: // x
                        this.rotateElement([vector[0] * .01, 0, 0])
                        this.renderTarget.innerHTML = `${(this.target.components.TransformComponent.rotation[0] * toDeg).toFixed(1)} θ`
                        break
                    case 2: // y
                        this.rotateElement([0, vector[1] * .01, 0])
                        this.renderTarget.innerHTML = `${(this.target.components.TransformComponent.rotation[1] * toDeg).toFixed(1)} θ`
                        break
                    case 3: // z
                        this.rotateElement([0, 0, vector[2] * .01])
                        this.renderTarget.innerHTML = `${(this.target.components.TransformComponent.rotation[2] * toDeg).toFixed(1)} θ`
                        break
                }

                break
            default:
                break
        }
    }

    rotateElement(vec) {
        this.target.components.TransformComponent.rotation = [
            this.target.components.TransformComponent.rotation[0] - vec[0],
            this.target.components.TransformComponent.rotation[1] - vec[1],
            this.target.components.TransformComponent.rotation[2] - vec[2]
        ]
    }


    execute(meshes, meshSources, selected, camera, pickSystem, setSelected, lockCamera, entities) {
        super.execute()

        if (selected.length > 0) {
            this.camera = camera
            this.shader.use()
            if (this.currentCoord && !this.tracking) {
                const el = meshes.find(m => m.id === selected[0])
                if (el) {
                    const pickID = pickSystem.pickElement((shader, proj) => {
                        this._drawGizmo( el.components.TransformComponent.translation, el.components.TransformComponent.rotation, camera.viewMatrix, proj, shader, true)
                    }, this.currentCoord, camera)

                    this.clickedAxis = pickID - 2

                    if (pickID === 0) {
                        lockCamera(false)
                        setSelected([])
                        this.currentCoord = undefined
                    } else {
                        this.tracking = true
                        lockCamera(true)

                        this.renderTarget.style.left = this.currentCoord.x + 'px'
                        this.renderTarget.style.top = this.currentCoord.y + 'px'
                        this.renderTarget.style.display = 'block'

                        this.target = el
                        this.gpu.canvas.requestPointerLock()
                        document.addEventListener("mousemove", this.handlerListener)
                    }
                }
            }
            if (!this.eventStarted) {
                this.eventStarted = true
                document.addEventListener('mousedown', this.handlerListener)
                document.addEventListener('mouseup', this.handlerListener)
            }
            if (selected.length === 1) {
                const el = meshes.find(m => m.id === selected[0])
                if (el) {

                    this._drawGizmo(el.components.TransformComponent.translation, el.components.TransformComponent.rotation, camera.viewMatrix, camera.projectionMatrix, this.gizmoShader)
                }
            }

            for (let i = 0; i < selected.length; i++) {
                const el = meshes.find(m => m.id === selected[i])
                if (el) {
                    MeshSystem.drawMesh(
                        this.shader,
                        this.gpu,
                        meshSources[el.components.MeshComponent.meshID],
                        camera.position,
                        camera.viewMatrix,
                        camera.projectionMatrix,
                        el.components.TransformComponent.transformationMatrix,
                        undefined,
                        el.components.MeshComponent.normalMatrix,
                        i)
                }
            }
        }

    }

    _rotateMatrix(t, rotation, axis, m) {
        const matrix = [...m]
        matrix[12] += t[0]
        matrix[13] += t[1]
        matrix[14] += t[2]


        switch (axis) {
            case 'x':
                mat4.rotateY(matrix, matrix, -rotation[0])
                break
            case 'y':
                mat4.rotateY(matrix, matrix, rotation[1])
                break
            case 'z':
                mat4.rotateY(matrix, matrix, rotation[2])
                break
            default:
                break
        }
        return matrix
    }

    _drawGizmo(translation, rotation, view, proj, shader, pick) {
        this.gpu.clear(this.gpu.DEPTH_BUFFER_BIT)
        this.gpu.disable(this.gpu.CULL_FACE)

        const mX = this._rotateMatrix(translation, rotation, 'x', this.xGizmo.components.TransformComponent.transformationMatrix)
        const mY = this._rotateMatrix(translation, rotation, 'y', this.yGizmo.components.TransformComponent.transformationMatrix)
        const mZ = this._rotateMatrix(translation, rotation, 'z', this.zGizmo.components.TransformComponent.transformationMatrix)
        const mC = this._rotateMatrix(translation, rotation, undefined, this.centerGizmo.components.TransformComponent.transformationMatrix)


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
        if (!pick)
            this._draw(view, mC, proj, 0, this.centerGizmo.components.PickComponent.pickID, shader)

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
