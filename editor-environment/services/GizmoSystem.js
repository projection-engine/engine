import TranslationGizmo from "../libs/transformation/TranslationGizmo"
import RotationGizmo from "../libs/transformation/RotationGizmo"
import ScalingGizmo from "../libs/transformation/ScalingGizmo"
import TRANSFORMATION_TYPE from "../../../../src/data/TRANSFORMATION_TYPE"
import getPickerId from "../../utils/get-picker-id"
import GizmoAPI from "../libs/GizmoAPI";
import Movable from "../../instances/Movable";
import TransformationAPI from "../../api/math/TransformationAPI";
import CameraAPI from "../../api/CameraAPI";
import ScreenSpaceGizmo from "../libs/transformation/ScreenSpaceGizmo";
import DualAxisGizmo from "../libs/transformation/DualAxisGizmo";
import GPUResources from "../../GPUResources";
import STATIC_MESHES from "../../static/resources/STATIC_MESHES";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import TransformationPass from "../../runtime/TransformationPass";
import INFORMATION_CONTAINER from "../../../../src/data/INFORMATION_CONTAINER";
import AXIS from "../data/AXIS";
import LineAPI from "../../api/rendering/LineAPI";
import {mat4, vec3} from "gl-matrix";
import IconsSystem from "./IconsSystem";
import GBuffer from "../../runtime/renderers/GBuffer";

const VEC_CACHE = vec3.create()
const M = mat4.create()
const EMPTY_COMPONENT = new Movable()
export default class GizmoSystem {
    static mainEntity
    static transformationMatrix
    static translation

    static targetRotation
    static targetGizmo
    static toBufferShader
    static gizmoShader
    static selectedEntities = []
    static clickedAxis
    static sensitivity = .001
    static totalMoved = 0
    static wasOnGizmo
    static rotationGizmoMesh
    static scaleGizmoMesh
    static translationGizmoMesh
    static dualAxisGizmoMesh
    static screenSpaceMesh
    static tooltip
    static translationGizmo
    static scaleGizmo
    static rotationGizmo
    static lineShader
    static EMPTY_COMPONENT = EMPTY_COMPONENT
    static transformationType = TRANSFORMATION_TYPE.GLOBAL
    static activeGizmoMatrix = M
    static #onSave

    static initialize(onSave) {
        GizmoSystem.#onSave = onSave
        GizmoSystem.screenSpaceMesh = GPUResources.meshes.get(STATIC_MESHES.PRODUCTION.SPHERE)
        GizmoSystem.dualAxisGizmoMesh = GPUResources.meshes.get(STATIC_MESHES.EDITOR.DUAL_AXIS_GIZMO)
        GizmoSystem.translationGizmoMesh = GPUResources.meshes.get(STATIC_MESHES.EDITOR.TRANSLATION_GIZMO)
        GizmoSystem.rotationGizmoMesh = GPUResources.meshes.get(STATIC_MESHES.EDITOR.ROTATION_GIZMO)
        GizmoSystem.scaleGizmoMesh = GPUResources.meshes.get(STATIC_MESHES.EDITOR.SCALE_GIZMO)

        EMPTY_COMPONENT._scaling[0] = .2
        EMPTY_COMPONENT._scaling[1] = .2
        EMPTY_COMPONENT._scaling[2] = .2

        TransformationAPI.transformMovable(EMPTY_COMPONENT)

        GizmoSystem.lineShader = GPUResources.shaders.get(STATIC_SHADERS.DEVELOPMENT.LINE)
        GizmoSystem.toBufferShader = GPUResources.shaders.get(STATIC_SHADERS.DEVELOPMENT.TO_BUFFER)
        GizmoSystem.gizmoShader = GPUResources.shaders.get(STATIC_SHADERS.DEVELOPMENT.GIZMO)
        GizmoSystem.translationGizmo = new TranslationGizmo()
        GizmoSystem.scaleGizmo = new ScalingGizmo()
        GizmoSystem.rotationGizmo = new RotationGizmo()
    }

    static save(key) {
        const changes = GizmoSystem.selectedEntities.map(e => ({id: e.id, value: [...e[key]], key}))
        if (key === "_translation")
            changes.push(...GizmoSystem.selectedEntities.map(e => ({
                id: e.id,
                key: "pivotPoint",
                value: [...e.pivotPoint]
            })))
        GizmoSystem.#onSave(changes)
    }

    static onMouseDown() {
        if (!GizmoSystem.tooltip)
            GizmoSystem.tooltip = document.getElementById(INFORMATION_CONTAINER.TRANSFORMATION)
    }

    static onMouseUp() {
        if (GizmoSystem.tooltip)
            setTimeout(() => {
                GizmoSystem.tooltip.finished()
            }, 250)
    }

    static drawToDepthSampler(mesh, transforms) {
        const FBO = GBuffer.gBuffer
        const data = {
            viewMatrix: CameraAPI.viewMatrix,
            projectionMatrix: CameraAPI.projectionMatrix,
            camPos: CameraAPI.position,
            translation: GizmoSystem.translation,
            cameraIsOrthographic: CameraAPI.isOrthographic
        }
        gpu.disable(gpu.CULL_FACE)
        FBO.startMapping()

        for (let i = 0; i < transforms.length; i++) {
            GizmoSystem.toBufferShader.bindForUse({
                ...data,
                transformMatrix: transforms[i],
                uID: getPickerId(i + 2),
            })
            mesh.draw()
        }

        GizmoSystem.toBufferShader.bindForUse({
            ...data,
            transformMatrix: GizmoSystem.transformationMatrix,
            uID: getPickerId(1)
        })
        GizmoSystem.screenSpaceMesh.draw()

        DualAxisGizmo.drawToBuffer(data)
        FBO.stopMapping()

        gpu.enable(gpu.CULL_FACE)
    }

    static #findMainEntity() {
        const main = GizmoSystem.selectedEntities[0]
        if (!main) {
            GizmoSystem.targetGizmo = undefined
            GizmoSystem.selectedEntities = []
            GizmoSystem.mainEntity = undefined
            GizmoSystem.transformationMatrix = undefined
            GizmoSystem.translation = undefined
        }
        else if (TransformationPass.hasUpdatedItem || GizmoSystem.mainEntity !== main) {
            main.__pivotChanged = true
            GizmoSystem.mainEntity = main
            GizmoSystem.updatePivot(main)
            GizmoSystem.targetRotation = main._rotationQuat
            GizmoSystem.transformationMatrix = GizmoAPI.translateMatrix(EMPTY_COMPONENT, GizmoSystem.transformationType)
        }
    }

    static updatePivot(m) {
        if (m.parent) {
            vec3.add(VEC_CACHE, m.pivotPoint, m.parent._translation)

            GizmoSystem.translation = VEC_CACHE
        } else
            GizmoSystem.translation = m.pivotPoint
    }

    static execute() {
        if (!GizmoSystem.selectedEntities.length && !GizmoSystem.translation)
            return

        if (GizmoSystem.selectedEntities.length > 0) {
            const t = GizmoSystem.targetGizmo
            GizmoSystem.#findMainEntity()

            if (t && GizmoSystem.translation != null) {
                const m = GizmoSystem.mainEntity
                if (m.__pivotChanged) {
                    GizmoSystem.updatePivot(m)
                    IconsSystem.getMatrix(m)
                }
                t.drawGizmo()
                ScreenSpaceGizmo.drawGizmo()
            }
            if (t instanceof TranslationGizmo) {
                const c = GizmoSystem.clickedAxis
                const o = {
                    viewMatrix: CameraAPI.viewMatrix,
                    transformMatrix: GizmoSystem.activeGizmoMatrix,
                    projectionMatrix: CameraAPI.projectionMatrix
                }
                if (c === AXIS.X) {
                    o.axis = [1, 0, 0]
                    GizmoSystem.lineShader.bindForUse(o)
                    LineAPI.draw(o.axis)
                }

                if (c === AXIS.Y) {
                    o.axis = [0, 1, 0]
                    GizmoSystem.lineShader.bindForUse(o)
                    LineAPI.draw(o.axis)
                }

                if (c === AXIS.Z) {
                    o.axis = [0, 0, 1]
                    GizmoSystem.lineShader.bindForUse(o)
                    LineAPI.draw(o.axis)
                }
            }

        } else if (GizmoSystem.targetGizmo || !GizmoSystem.selectedEntities[0]) {
            GizmoSystem.targetGizmo = undefined
            GizmoSystem.selectedEntities = []
            GizmoSystem.mainEntity = undefined
            GizmoSystem.transformationMatrix = undefined
            GizmoSystem.translation = undefined
        }
    }

    static notify(targetBuffer) {
        if (!GizmoSystem.tooltip)
            return

        GizmoSystem.tooltip.isChanging()
        GizmoSystem.totalMoved = 1
        GizmoSystem.tooltip.innerText = `X ${targetBuffer[0].toFixed(2)}  |  Y ${targetBuffer[1].toFixed(2)}  |  Z ${targetBuffer[2].toFixed(2)}`
    }

}