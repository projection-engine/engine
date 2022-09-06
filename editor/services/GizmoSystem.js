import Translation from "../libs/Translation"
import Rotation from "../libs/Rotation"
import Scale from "../libs/Scale"
import TRANSFORMATION_TYPE from "../../../../data/TRANSFORMATION_TYPE"
import getPickerId from "../../production/utils/get-picker-id"
import MovementPass from "../../production/templates/passes/MovementPass";
import Gizmo from "../libs/Gizmo";
import Movable from "../../production/templates/Movable";
import TransformationAPI from "../../production/libs/TransformationAPI";
import CameraAPI from "../../production/libs/CameraAPI";
import ScreenSpaceGizmo from "../libs/ScreenSpaceGizmo";
import DualAxisGizmo from "../libs/DualAxisGizmo";
import GPU from "../../production/controllers/GPU";
import STATIC_MESHES from "../../static/STATIC_MESHES";
import DepthPass from "../../production/templates/passes/DepthPass";
import STATIC_SHADERS from "../../static/STATIC_SHADERS";

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

    static DEFAULT_ROTATION = toDeg
    static DEFAULT_SCALE = .001
    static DEFAULT_TRANSLATION = .001

    static initialize() {

        GizmoSystem.screenSpaceMesh = GPU.meshes.get(STATIC_MESHES.SPHERE)
        GizmoSystem.dualAxisGizmoMesh = GPU.meshes.get(STATIC_MESHES.DUAL_AXIS_GIZMO)
        GizmoSystem.translationGizmoMesh = GPU.meshes.get(STATIC_MESHES.TRANSLATION_GIZMO)
        GizmoSystem.rotationGizmoMesh = GPU.meshes.get(STATIC_MESHES.ROTATION_GIZMO)
        GizmoSystem.scaleGizmoMesh = GPU.meshes.get(STATIC_MESHES.SCALE_GIZMO)

        EMPTY_COMPONENT.scaling = [.2, .2, .2]
        TransformationAPI.transform(EMPTY_COMPONENT.translation, EMPTY_COMPONENT.rotationQuaternion, EMPTY_COMPONENT.scaling, EMPTY_COMPONENT.transformationMatrix)

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
        const matrix = main.transformationMatrix
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
        if (MovementPass.hasUpdatedItem || GizmoSystem.mainEntity !== main && main) {
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
            gpu.clear(gpu.DEPTH_BUFFER_BIT)
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
