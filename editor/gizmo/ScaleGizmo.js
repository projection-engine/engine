import {vec4} from "gl-matrix";
import Entity from "../../basic/Entity";
import TransformComponent from "../../components/TransformComponent";
import MeshInstance from "../../instances/MeshInstance";
import Transformation from "../../instances/Transformation";
import PickComponent from "../../components/PickComponent";
import arrow from '../assets/ScaleGizmo.json'
import COMPONENTS from "../../templates/COMPONENTS";
import ROTATION_TYPES from "./ROTATION_TYPES";
import TranslateScaleGizmo from "./TranslateScaleGizmo";

export default class ScaleGizmo extends TranslateScaleGizmo {
    target = []
    clickedAxis = -1
    tracking = false
    rotationTarget = [0, 0, 0, 1]

    distanceX = 0
    distanceY = 0
    distanceZ = 0

    constructor(gpu, gizmoShader, renderTarget) {
        super(gpu, gizmoShader, renderTarget);
        this.xGizmo = this._mapEntity(2, 'x')
        this.yGizmo = this._mapEntity(3, 'y')
        this.zGizmo = this._mapEntity(4, 'z')

        this.xyz = new MeshInstance({
            gpu,
            vertices: arrow.vertices,
            indices: arrow.indices
        })


        this.handlerListener = this.handler.bind(this)
        this.gpu.canvas.addEventListener('mousedown', this.handlerListener)
        this.gpu.canvas.addEventListener('mouseup', this.handlerListener)
    }

    _mapEntity(i, axis) {
        const e = new Entity(undefined)
        e.components[COMPONENTS.PICK] = new PickComponent(undefined, i - 3)
        e.components[COMPONENTS.TRANSFORM] = new TransformComponent()
        let s = [.2, 0.2, 0.2], r
        switch (axis) {
            case 'x':
                r = [0, 1.57, 0]
                break
            case 'y':
                r = [-1.57, 1.57, 0]
                break
            case 'z':
                r = [3.1415, -3.1415, 3.1415]
                break
            default:
                break
        }
        e.components[COMPONENTS.TRANSFORM].translation = [0, 0, 0]
        e.components[COMPONENTS.TRANSFORM].rotation = r
        e.components[COMPONENTS.TRANSFORM].scaling = s
        e.components[COMPONENTS.TRANSFORM].transformationMatrix = Transformation.transform([0, 0, 0], r, s)

        return e
    }

    handler(event) {
        super.handler(event)
        if (event.type === 'mousemove') {
            if (!this.started) {
                this.renderTarget.start()
                this.started = true
                this.onGizmoStart()
            }
            const vector = [event.movementX, event.movementX, event.movementX]

            switch (this.clickedAxis) {
                case 1: // x
                    this.distanceX += Math.abs(vector[0] * 0.01)
                    if (Math.abs(this.distanceX) >= this.gridSize) {
                        this.transformElement([Math.sign(vector[0]) * this.distanceX, 0, 0])
                        this.distanceX = 0
                    }
                    break
                case 2: // y
                    this.distanceY += Math.abs(vector[1] * 0.01)
                    if (Math.abs(this.distanceY) >= this.gridSize) {
                        this.transformElement([0, Math.sign(vector[1]) * this.distanceY, 0])
                        this.distanceY = 0
                    }
                    break
                case 3: // z
                    this.distanceZ += Math.abs(vector[2] * 0.01)
                    if (Math.abs(this.distanceZ) >= this.gridSize) {
                        this.transformElement([0, 0, Math.sign(vector[2]) * this.distanceZ])
                        this.distanceZ = 0
                    }
                    break
            }
            if(this.target.length === 1)
                this.renderTarget.render(this.target[0].components[COMPONENTS.TRANSFORM].scaling)
        }
    }

    transformElement(vec) {
        let toApply
        if (this.typeRot === ROTATION_TYPES.RELATIVE || this.target.length > 1)
            toApply = vec
        else
            toApply = vec4.transformQuat([], vec, this.target[0].components[COMPONENTS.TRANSFORM].rotationQuat)
        for (let i = 0; i < this.target.length; i++) {
            const target = this.target[i]
            target.components[COMPONENTS.TRANSFORM].scaling = [
                target.components[COMPONENTS.TRANSFORM].scaling[0] - toApply[0],
                target.components[COMPONENTS.TRANSFORM].scaling[1] - toApply[1],
                target.components[COMPONENTS.TRANSFORM].scaling[2] - toApply[2]
            ]
        }
    }

    execute(meshes, meshSources, selected, camera, pickSystem, lockCamera, entities, transformationType, onGizmoStart, onGizmoEnd, gridSize) {
        if(selected[0] && entities[selected[0]].components[COMPONENTS.TRANSFORM])
            super.execute(meshes, meshSources, selected, camera, pickSystem, lockCamera, entities, transformationType, onGizmoStart, onGizmoEnd, gridSize, this.xyz);
    }
}
