import Translation from "../libs/gizmo/Translation"
import Rotation from "../libs/gizmo/Rotation"
import Scale from "../libs/gizmo/Scale"
import TRANSFORMATION_TYPE from "../../../../data/misc/TRANSFORMATION_TYPE"
import ShaderInstance from "../../production/controllers/instances/ShaderInstance"
import * as gizmoShaderCode from "../templates/GIZMO.glsl"
import getPickerId from "../../production/utils/get-picker-id"
import LoopController from "../../production/controllers/LoopController";
import MovementPass from "../../production/templates/passes/MovementPass";
import Gizmo from "../libs/gizmo/libs/Gizmo";
import Movable from "../../production/templates/Movable";
import Transformation from "../../production/libs/Transformation";
import CameraAPI from "../../production/libs/apis/CameraAPI";
import ScreenSpaceGizmo from "../libs/gizmo/ScreenSpaceGizmo";
import DualAxisGizmo from "../libs/gizmo/DualAxisGizmo";
import GPU from "../../production/controllers/GPU";
import STATIC_MESHES from "../../static/STATIC_MESHES";
import ROTATION_GIZMO from "../data/ROTATION_GIZMO.json";
import SCALE_GIZMO from "../data/SCALE_GIZMO.json";
import TRANSLATION_GIZMO from "../data/TRANSLATION_GIZMO.json";
import PLANE from "../data/DUAL_AXIS_GIZMO.json";
import DepthPass from "../../production/templates/passes/DepthPass";

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
    static cubeMesh

    static translationGizmo
    static scaleGizmo
    static rotationGizmo

    constructor() {
        GPU.allocateMesh(STATIC_MESHES.DUAL_AXIS_GIZMO, PLANE)
        GPU.allocateMesh(STATIC_MESHES.ROTATION_GIZMO, ROTATION_GIZMO)
        GPU.allocateMesh(STATIC_MESHES.SCALE_GIZMO, SCALE_GIZMO)
        GPU.allocateMesh(STATIC_MESHES.TRANSLATION_GIZMO, TRANSLATION_GIZMO)

        GizmoSystem.cubeMesh = GPU.meshes.get(STATIC_MESHES.CUBE)
        GizmoSystem.dualAxisGizmoMesh = GPU.meshes.get(STATIC_MESHES.DUAL_AXIS_GIZMO)
        GizmoSystem.translationGizmoMesh = GPU.meshes.get(STATIC_MESHES.TRANSLATION_GIZMO)
        GizmoSystem.rotationGizmoMesh = GPU.meshes.get(STATIC_MESHES.ROTATION_GIZMO)
        GizmoSystem.scaleGizmoMesh = GPU.meshes.get(STATIC_MESHES.SCALE_GIZMO)

        EMPTY_COMPONENT.scaling = [.2, .2, .2]
        Transformation.transform(EMPTY_COMPONENT.translation, EMPTY_COMPONENT.rotationQuaternion, EMPTY_COMPONENT.scaling, EMPTY_COMPONENT.transformationMatrix)

        GizmoSystem.toBufferShader = new ShaderInstance(gizmoShaderCode.sameSizeVertex, gizmoShaderCode.pickFragment)
        GizmoSystem.gizmoShader = new ShaderInstance(gizmoShaderCode.vertex, gizmoShaderCode.fragment)

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
        GizmoSystem.cubeMesh.draw()

        DualAxisGizmo.drawToBuffer(data)
        FBO.stopMapping()

        gpu.enable(gpu.CULL_FACE)
        return FBO
    }

    #findMainEntity() {
        const main = GizmoSystem.selectedEntities[0]
        if (MovementPass.hasUpdatedItem || GizmoSystem.mainEntity !== main && main) {
            GizmoSystem.mainEntity = main
            GizmoSystem.updateTranslation()

            GizmoSystem.targetRotation = main.rotationQuaternion
            GizmoSystem.transformationMatrix = Gizmo.translateMatrix(EMPTY_COMPONENT, GizmoSystem.transformationType)
        }
        else if (!main){
            GizmoSystem.targetGizmo = undefined
            GizmoSystem.selectedEntities = []
            GizmoSystem.mainEntity = undefined
            GizmoSystem.transformationMatrix = undefined
            GizmoSystem.translation = undefined
        }
    }

    execute(transformationType = TRANSFORMATION_TYPE.GLOBAL) {

        if (GizmoSystem.selectedEntities.length > 0) {
            gpu.clear(gpu.DEPTH_BUFFER_BIT)
            this.#findMainEntity()
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
