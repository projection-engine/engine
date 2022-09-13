import Translation from "../libs/Translation"
import Rotation from "../libs/Rotation"
import Scale from "../libs/Scale"
import TRANSFORMATION_TYPE from "../../../../src/editor/data/TRANSFORMATION_TYPE"
import getPickerId from "../../production/utils/get-picker-id"
import Gizmo from "../libs/Gizmo";
import Movable from "../../production/instances/entity/Movable";
import TransformationAPI from "../../production/apis/TransformationAPI";
import CameraAPI from "../../production/apis/CameraAPI";
import ScreenSpaceGizmo from "../libs/ScreenSpaceGizmo";
import DualAxisGizmo from "../libs/DualAxisGizmo";
import GPU from "../../production/GPU";
import STATIC_MESHES from "../../static/resources/STATIC_MESHES";
import DepthPass from "../../production/passes/effects/DepthPass";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import Entity from "../../production/instances/entity/Entity";
import WorkerController from "../../production/workers/WorkerController";

const EMPTY_COMPONENT = new Movable()
const toDeg = Math.PI/180
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

    static translationGizmo
    static scaleGizmo
    static rotationGizmo

    static initialize() {

        GizmoSystem.screenSpaceMesh = GPU.meshes.get(STATIC_MESHES.PRODUCTION.SPHERE)
        GizmoSystem.dualAxisGizmoMesh = GPU.meshes.get(STATIC_MESHES.EDITOR.DUAL_AXIS_GIZMO)
        GizmoSystem.translationGizmoMesh = GPU.meshes.get(STATIC_MESHES.EDITOR.TRANSLATION_GIZMO)
        GizmoSystem.rotationGizmoMesh = GPU.meshes.get(STATIC_MESHES.EDITOR.ROTATION_GIZMO)
        GizmoSystem.scaleGizmoMesh = GPU.meshes.get(STATIC_MESHES.EDITOR.SCALE_GIZMO)

        EMPTY_COMPONENT.scaling = [.2, .2, .2]
        TransformationAPI.transform(EMPTY_COMPONENT.translation, EMPTY_COMPONENT.rotationQuaternion, EMPTY_COMPONENT.scaling, EMPTY_COMPONENT.matrix)

        GizmoSystem.toBufferShader = GPU.shaders.get(STATIC_SHADERS.DEVELOPMENT.TO_BUFFER)
        GizmoSystem.gizmoShader = GPU.shaders.get(STATIC_SHADERS.DEVELOPMENT.GIZMO)
        GizmoSystem.translationGizmo = new Translation()
        GizmoSystem.scaleGizmo = new Scale()
        GizmoSystem.rotationGizmo = new Rotation()
    }

    static updateTranslation() {
        const main = GizmoSystem.mainEntity
        if (!main)
            return
        const matrix = main.matrix
        GizmoSystem.translation = [matrix[12], matrix[13], matrix[14]]
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
        return FBO
    }

    static #findMainEntity() {
        const main = GizmoSystem.selectedEntities[0]
        if ((WorkerController.hasUpdatedItem || GizmoSystem.mainEntity !== main) && main instanceof Entity) {
            GizmoSystem.mainEntity = main
            GizmoSystem.updateTranslation()

            GizmoSystem.targetRotation = main.rotationQuaternion
            GizmoSystem.transformationMatrix = Gizmo.translateMatrix(EMPTY_COMPONENT, GizmoSystem.transformationType)
        } else if (!main) {
            GizmoSystem.targetGizmo = undefined
            GizmoSystem.selectedEntities = []
            GizmoSystem.mainEntity = undefined
            GizmoSystem.transformationMatrix = undefined
            GizmoSystem.translation = undefined
        }
    }

    static execute(transformationType = TRANSFORMATION_TYPE.GLOBAL) {

        if (GizmoSystem.selectedEntities.length > 0) {

            GizmoSystem.#findMainEntity()
            GizmoSystem.transformationType = transformationType
            if (GizmoSystem.targetGizmo && GizmoSystem.translation != null)
                GizmoSystem.targetGizmo.drawGizmo()
            ScreenSpaceGizmo.drawGizmo()
        } else if (GizmoSystem.targetGizmo || !GizmoSystem.selectedEntities[0]) {
            GizmoSystem.targetGizmo = undefined
            GizmoSystem.selectedEntities = []
            GizmoSystem.mainEntity = undefined
            GizmoSystem.transformationMatrix = undefined
            GizmoSystem.translation = undefined
        }
    }
}
