import Translation from "../libs/gizmo/Translation"
import Rotation from "../libs/gizmo/Rotation"
import Scale from "../libs/gizmo/Scale"
import TRANSFORMATION_TYPE from "../../../../data/misc/TRANSFORMATION_TYPE"
import ShaderInstance from "../../production/libs/instances/ShaderInstance"
import * as gizmoShaderCode from "../templates/GIZMO.glsl"
import getPickerId from "../../production/utils/get-picker-id"
import LoopAPI from "../../production/libs/apis/LoopAPI";
import Transformations from "../../production/libs/passes/misc/Transformations";
import getEntityTranslation from "../libs/gizmo/utils/get-entity-translation";
import EditorRenderer from "../EditorRenderer";
import Gizmo from "../libs/gizmo/libs/Gizmo";
import COMPONENTS from "../../production/data/COMPONENTS";
import Movable from "../../production/templates/basic/Movable";
import Transformation from "../../production/services/Transformation";
import CameraAPI from "../../production/libs/apis/CameraAPI";
import ScreenSpaceGizmo from "../libs/gizmo/ScreenSpaceGizmo";
import {vec3} from "gl-matrix";
import AXIS from "../libs/gizmo/AXIS";
import DualAxisGizmo, {XY_ID, XZ_ID, ZY_ID} from "../libs/gizmo/DualAxisGizmo";
import GPU from "../../production/GPU";
import STATIC_MESHES from "../../static/STATIC_MESHES";
import ROTATION_GIZMO from "../data/ROTATION_GIZMO.json";
import SCALE_GIZMO from "../data/SCALE_GIZMO.json";
import TRANSLATION_GIZMO from "../data/TRANSLATION_GIZMO.json";
import PLANE from "../data/PLANE.json";

const EMPTY_COMPONENT = new Movable()
let depthSystem
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

        this.translationGizmo = new Translation()
        this.scaleGizmo = new Scale()
        this.rotationGizmo = new Rotation()
    }


    static drawToDepthSampler(mesh, transforms) {
        const data = {
            viewMatrix: CameraAPI.viewMatrix,
            projectionMatrix: CameraAPI.projectionMatrix,
            camPos: CameraAPI.position,
            translation: GizmoSystem.translation,
            cameraIsOrthographic: CameraAPI.isOrthographic
        }
        gpu.disable(gpu.CULL_FACE)

        depthSystem.frameBuffer.startMapping()

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
        depthSystem.frameBuffer.stopMapping()

        gpu.enable(gpu.CULL_FACE)
        return depthSystem.frameBuffer
    }

    #findMainEntity() {
        const main = GizmoSystem.selectedEntities[0]
        if (Transformations.hasUpdatedItem || GizmoSystem.mainEntity !== main) {
            GizmoSystem.mainEntity = main
            GizmoSystem.translation = getEntityTranslation(main)

            GizmoSystem.targetRotation = main.rotationQuaternion
            GizmoSystem.transformationMatrix = Gizmo.translateMatrix(EMPTY_COMPONENT, GizmoSystem.transformationType)
        }
    }

    execute(transformationType = TRANSFORMATION_TYPE.GLOBAL) {
        if (!depthSystem)
            depthSystem = LoopAPI.renderMap.get("depthPrePass")
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
