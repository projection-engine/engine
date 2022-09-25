import Translation from "../libs/transformation/Translation"
import Rotation from "../libs/transformation/Rotation"
import Scale from "../libs/transformation/Scale"
import TRANSFORMATION_TYPE from "../../../../src/editor/data/TRANSFORMATION_TYPE"
import getPickerId from "../../production/utils/get-picker-id"
import GizmoAPI from "../libs/GizmoAPI";
import Movable from "../../production/instances/Movable";
import TransformationAPI from "../../production/apis/math/TransformationAPI";
import CameraAPI from "../../production/apis/CameraAPI";
import ScreenSpaceGizmo from "../libs/transformation/ScreenSpaceGizmo";
import DualAxisGizmo from "../libs/transformation/DualAxisGizmo";
import GPU from "../../production/GPU";
import STATIC_MESHES from "../../static/resources/STATIC_MESHES";
import DepthPass from "../../production/passes/rendering/DepthPass";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import Entity from "../../production/instances/Entity";
import MovementWorker from "../../production/workers/movement/MovementWorker";
import INFORMATION_CONTAINER from "../../../../src/editor/data/INFORMATION_CONTAINER";
import AXIS from "../data/AXIS";
import LineAPI from "../../production/apis/rendering/LineAPI";
import {mat4} from "gl-matrix";

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

    static initialize() {

        GizmoSystem.screenSpaceMesh = GPU.meshes.get(STATIC_MESHES.PRODUCTION.SPHERE)
        GizmoSystem.dualAxisGizmoMesh = GPU.meshes.get(STATIC_MESHES.EDITOR.DUAL_AXIS_GIZMO)
        GizmoSystem.translationGizmoMesh = GPU.meshes.get(STATIC_MESHES.EDITOR.TRANSLATION_GIZMO)
        GizmoSystem.rotationGizmoMesh = GPU.meshes.get(STATIC_MESHES.EDITOR.ROTATION_GIZMO)
        GizmoSystem.scaleGizmoMesh = GPU.meshes.get(STATIC_MESHES.EDITOR.SCALE_GIZMO)

        EMPTY_COMPONENT._scaling[0] = .2
        EMPTY_COMPONENT._scaling[1] = .2
        EMPTY_COMPONENT._scaling[2] = .2

        TransformationAPI.transform(EMPTY_COMPONENT._translation, EMPTY_COMPONENT._rotationQuat, EMPTY_COMPONENT._scaling, EMPTY_COMPONENT.matrix)

        GizmoSystem.lineShader = GPU.shaders.get(STATIC_SHADERS.DEVELOPMENT.LINE)
        GizmoSystem.toBufferShader = GPU.shaders.get(STATIC_SHADERS.DEVELOPMENT.TO_BUFFER)
        GizmoSystem.gizmoShader = GPU.shaders.get(STATIC_SHADERS.DEVELOPMENT.GIZMO)
        GizmoSystem.translationGizmo = new Translation()
        GizmoSystem.scaleGizmo = new Scale()
        GizmoSystem.rotationGizmo = new Rotation()
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
        const FBO = DepthPass.framebuffer
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
        if ((MovementWorker.hasUpdatedItem || GizmoSystem.mainEntity !== main) && main instanceof Entity) {
            GizmoSystem.mainEntity = main
            GizmoSystem.targetRotation = main._rotationQuat
            GizmoSystem.translation = main.absoluteTranslation
            GizmoSystem.transformationMatrix = GizmoAPI.translateMatrix(EMPTY_COMPONENT, GizmoSystem.transformationType)


        } else if (!main) {
            GizmoSystem.targetGizmo = undefined
            GizmoSystem.selectedEntities = []
            GizmoSystem.mainEntity = undefined
            GizmoSystem.transformationMatrix = undefined
            GizmoSystem.translation = undefined
        }
    }

    static execute() {

        if (GizmoSystem.selectedEntities.length > 0) {
            const t = GizmoSystem.targetGizmo
            GizmoSystem.#findMainEntity()
            if (t && GizmoSystem.translation != null) {
                t.drawGizmo()
                ScreenSpaceGizmo.drawGizmo()
            }
            if (t instanceof Translation) {
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
