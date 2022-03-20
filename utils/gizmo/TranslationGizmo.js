import System from "../../ecs/basic/System";
import MeshSystem from "../../ecs/systems/MeshSystem";
import Shader from "../workers/Shader";
import * as shaderCode from "../../shaders/mesh/meshSelected.glsl";
import * as gizmoShaderCode from "../../shaders/misc/gizmo.glsl";

import {vec3} from "gl-matrix";
import Entity from "../../ecs/basic/Entity";
import TransformComponent from "../../ecs/components/TransformComponent";
import MeshInstance from "../../instances/MeshInstance";
import Transformation from "../workers/Transformation";
import PickComponent from "../../ecs/components/PickComponent";
import COMPONENTS from "../../../utils/misc/COMPONENTS";
import cube from '../../../../static/assets/Cube.json'

export default class TranslationGizmo extends System {
    eventStarted = false
    clickedAxis = -1
    tracking = false

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.gizmoShader = new Shader(gizmoShaderCode.vertex, gizmoShaderCode.fragment, gpu)

        this.xGizmo = this._mapEntity(2, 'x')
        this.yGizmo = this._mapEntity(3, 'y')
        this.zGizmo = this._mapEntity(4, 'z')
        this.centerGizmo = this._mapEntity(1, 'c')

        this.xyz = new MeshInstance({
            gpu,
            vertices: cube.vertices,
            indices: cube.indices,
            normals: cube.normals,
            uvs: cube.uvs,
            tangents: cube.tangents,
        })
        this.handlerListener = this.handler.bind(this)
    }

    _mapEntity(i, axis) {
        const e = new Entity(undefined)
        e.addComponent(new PickComponent(undefined, i - 3))
        e.addComponent(new TransformComponent())
        let s, t, r
        switch (axis) {
            case 'x':
                s = [1.5, 0.1, 0.1]
                t = [3, 0, 0]
                r = [0, 0, 0]
                break
            case 'y':
                s = [1.5, 0.1, 0.1]
                t = [0, 3, 0]
                r = [0, 0, 1.57]
                break
            case 'z':
                s = [1.5, 0.1, 0.1]
                t = [0, 0, 3]
                r = [3.141592653589793, -1.57, 3.141592653589793]
                break
            case 'c':
                s = [.3, .3, .3]
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
                this.currentCoord = undefined
                document.removeEventListener("mousemove", this.handlerListener)
                document.exitPointerLock()
                this.t = 0
                break
            case 'mousemove':
                const w = this.gpu.canvas.width
                const h = this.gpu.canvas.height
                const times = (w > h ? h / w : w / h) / 10

                const vector = [event.movementX, event.movementY, event.movementX]
                vec3.transformQuat(vector, vector, this.camera.orientation);

                switch (this.clickedAxis) {
                    case 1: // x
                        this.transformElement([vector[0], 0, 0])
                        break
                    case 2: // y
                        this.transformElement([0, vector[1] * times, 0])

                        break
                    case 3: // z
                        this.transformElement([0, 0, vector[2] * times * 5])
                        break
                }

                break
            default:
                break
        }
    }

    transformElement(vec) {
        const k = Object.keys(this.target.components)
        let key
        for (let i = 0; i < k.length; i++) {
            switch (k[i]) {
                case COMPONENTS.CUBE_MAP:
                case COMPONENTS.POINT_LIGHT:
                    key = k[i] === COMPONENTS.CUBE_MAP ? 'CubeMapComponent' : 'PointLightComponent'
                    this.target.components[key].position = [
                        this.target.components[key].position[0] - vec[0],
                        this.target.components[key].position[1] - vec[1],
                        this.target.components[key].position[2] - vec[2]
                    ]
                    break
                case COMPONENTS.SKYLIGHT:
                case COMPONENTS.DIRECTIONAL_LIGHT:
                    key = k[i] === COMPONENTS.SKYLIGHT ? 'SkylightComponent' : 'DirectionalLightComponent'
                    this.target.components[key].direction = [
                        this.target.components[key].direction[0] - vec[0],
                        this.target.components[key].direction[1] - vec[1],
                        this.target.components[key].direction[2] - vec[2]
                    ]
                    break
                case COMPONENTS.TRANSFORM:
                    this.target.components.TransformComponent.translation = [
                        this.target.components.TransformComponent.translation[0] - vec[0],
                        this.target.components.TransformComponent.translation[1] - vec[1],
                        this.target.components.TransformComponent.translation[2] - vec[2]
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
                case COMPONENTS.CUBE_MAP:
                case COMPONENTS.POINT_LIGHT:
                    key = k[i] === COMPONENTS.CUBE_MAP ? 'CubeMapComponent' : 'PointLightComponent'
                    return el.components[key].position
                case COMPONENTS.SKYLIGHT:
                case COMPONENTS.DIRECTIONAL_LIGHT:
                    key = k[i] === COMPONENTS.SKYLIGHT ? 'SkylightComponent' : 'DirectionalLightComponent'
                    return el.components[key].direction
                case COMPONENTS.TRANSFORM:
                    return el.components.TransformComponent.translation
                default:
                    break
            }
        }

    }

    execute(meshes, meshSources, selected, camera, pickSystem, setSelected, lockCamera, entities) {
        super.execute()

        if (selected.length > 0) {
            this.camera = camera
            this.shader.use()
            if (this.currentCoord && !this.tracking) {
                const el = entities.find(m => m.id === selected[0])
                const translation = this.getTranslation(el)

                if (translation !== undefined) {
                    const pickID = pickSystem.pickElement((shader, proj) => {
                        this._drawGizmo(translation, camera.viewMatrix, proj, shader, true)
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

            for (let i = 0; i < selected.length; i++) {

                const el = entities.find(m => m.id === selected[i])
                const translation = this.getTranslation(el)

                if (el && translation) {
                    if (selected.length === 1)
                        this._drawGizmo(translation, camera.viewMatrix, camera.projectionMatrix, this.gizmoShader)
                    if (el.components.TransformComponent)
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

    _drawGizmo(translation, view, proj, shader, pick) {

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
        if (!pick)
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
