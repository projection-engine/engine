import System from "../../basic/System";
import MeshSystem from "../MeshSystem";
import Shader from "../../../utils/workers/Shader";
import * as shaderCode from "../../../shaders/mesh/meshSelected.glsl";
import * as gizmoShaderCode from "../../../shaders/misc/gizmo.glsl";

import {mat4} from "gl-matrix";
import Entity from "../../basic/Entity";
import TransformComponent from "../../components/TransformComponent";
import MeshComponent from "../../components/MeshComponent";
import MeshInstance from "../../../instances/MeshInstance";
import Transformation from "../../../utils/workers/Transformation";
import PickComponent from "../../components/PickComponent";

export default class SelectedSystem extends System {
    eventStarted = false
    clickedAxis = -1
    t = 0
    tracking = false

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.gizmoShader = new Shader(gizmoShaderCode.vertex, gizmoShaderCode.fragment, gpu)

        Promise.all([
            import('../../../../../static/assets/gizmo/x.json'),
            import('../../../../../static/assets/gizmo/y.json'),
            import('../../../../../static/assets/gizmo/z.json'),
            import('../../../../../static/assets/gizmo/center.json')
        ]).then(([x, y, z, center]) => {
            this.xGizmo = this._mapEntity(x, 2)
            this.yGizmo = this._mapEntity(y, 3)
            this.zGizmo = this._mapEntity(z, 4)
            this.centerGizmo = this._mapEntity(center, 1)

            this.xyz = new MeshInstance({
                gpu,
                vertices: x.vertices,
                indices: x.indices,
                normals: x.normals,
                uvs: x.uvs,
                tangents: x.tangents,
            })
        })

        this.handlerListener = this.handler.bind(this)
    }

    _mapEntity(data, i) {
        const e = new Entity(undefined)

        e.addComponent(new PickComponent(undefined, i - 3))

        e.addComponent(new TransformComponent())
        e.components.TransformComponent.translation = data.translation
        e.components.TransformComponent.rotation = data.rotation
        e.components.TransformComponent.transformationMatrix = Transformation.transform(data.translation, data.rotation, data.scaling)


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
                this.currentCoord = undefined
                document.removeEventListener("mousemove", this.handlerListener)
                this.t = 0
                break
            case 'mousemove':
                if(document.pointerLockElement)
                    document.exitPointerLock()
                console.log(event.movementX, event.clientX)

                const forward = event.movementX
                switch (this.clickedAxis) {
                    case 1: // x
                        this.target.components.TransformComponent.translation = [
                            this.target.components.TransformComponent.translation[0] + 1 *forward,
                            this.target.components.TransformComponent.translation[1],
                            this.target.components.TransformComponent.translation[2]
                        ]

                        break
                    case 2: // y

                        this.target.components.TransformComponent.translation = [
                            this.target.components.TransformComponent.translation[0],
                            this.target.components.TransformComponent.translation[1] + 1 *forward,
                            this.target.components.TransformComponent.translation[2]
                        ]

                        break
                    case 3: // z

                        this.target.components.TransformComponent.translation = [
                            this.target.components.TransformComponent.translation[0],
                            this.target.components.TransformComponent.translation[1],
                            this.target.components.TransformComponent.translation[2] + 1 *forward,
                        ]

                        break
                }
                this.lastX = event.clientX
                break
            default:
                break
        }
    }

    execute(meshes, meshSources, selected, camera, pickSystem, setSelected, lockCamera, entities) {
        super.execute()

        if (selected.length > 0) {

            this.shader.use()
            if (this.currentCoord && !this.tracking) {
                const el = entities.find(m => m.id === selected[0])
                const pickID = pickSystem.pickElement((shader, proj) => {
                    this._drawGizmo(el.components.TransformComponent.translation, camera.viewMatrix, proj, shader)
                }, this.currentCoord, camera)

                this.clickedAxis = pickID - 2

                if (pickID === 0) {
                    lockCamera(false)
                    setSelected([])
                    this.currentCoord = undefined
                } else {
                    this.tracking = true
                    lockCamera(true)
                    this.target = el
                    document.addEventListener("mousemove", this.handlerListener)
                }
            }
            if (!this.eventStarted) {
                this.eventStarted = true
                document.addEventListener('mousedown', this.handlerListener)
                document.addEventListener('mouseup', this.handlerListener)
            }

            for (let i = 0; i < selected.length; i++) {
                const el = meshes.find(m => m.id === selected[i])

                if (el) {
                    if (selected.length === 1)
                        this._drawGizmo(el.components.TransformComponent.translation, camera.viewMatrix, camera.projectionMatrix, this.gizmoShader)


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

    _translateMatrix(t, m) {
        const matrix = [...m]
        matrix[12] += t[0]
        matrix[13] += t[1]
        matrix[14] += t[2]

        return matrix
    }

    _drawGizmo(translation, view, proj, shader) {
        const mX = this._translateMatrix(translation, this.xGizmo.components.TransformComponent.transformationMatrix)
        const mY = this._translateMatrix(translation, this.yGizmo.components.TransformComponent.transformationMatrix)
        const mZ = this._translateMatrix(translation, this.zGizmo.components.TransformComponent.transformationMatrix)
        const mC = this._translateMatrix(translation, this.centerGizmo.components.TransformComponent.transformationMatrix)


        shader.use()
        this.gpu.bindVertexArray(this.xyz.VAO)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, this.xyz.indexVBO)
        this.xyz.vertexVBO.enable()

        this._draw(view, mX, proj, 1, this.xGizmo.components.PickComponent.pickID, shader)
        this._draw(view, mY, proj, 2, this.yGizmo.components.PickComponent.pickID, shader)
        this._draw(view, mZ, proj, 3, this.zGizmo.components.PickComponent.pickID, shader)
        this._draw(view, mC, proj, 0, this.centerGizmo.components.PickComponent.pickID, shader)

        this.xyz.vertexVBO.disable()
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
