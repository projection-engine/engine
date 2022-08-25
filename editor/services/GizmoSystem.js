import Translation from "../libs/gizmo/Translation"
import Rotation from "../libs/gizmo/Rotation"
import Scale from "../libs/gizmo/Scale"
import TRANSFORMATION_TYPE from "../../../../data/misc/TRANSFORMATION_TYPE"
import ShaderInstance from "../../production/libs/instances/ShaderInstance"
import * as gizmoShaderCode from "../templates/GIZMO.glsl"
import getPickerId from "../../production/utils/get-picker-id"
import * as shaderCode from "../../production/data/shaders/PICK.glsl"
import LoopAPI from "../../production/libs/apis/LoopAPI";
import MeshInstance from "../../production/libs/instances/MeshInstance";
import PLANE from "../data/PLANE.json";
import Transformations from "../../production/libs/passes/misc/Transformations";
import getEntityTranslation from "../libs/gizmo/utils/get-entity-translation";
import EditorRenderer from "../EditorRenderer";
import Gizmo from "../libs/gizmo/libs/Gizmo";
import COMPONENTS from "../../production/data/COMPONENTS";
import TransformComponent from "../../production/templates/components/TransformComponent";
import Transformation from "../../production/services/Transformation";
import CameraAPI from "../../production/libs/apis/CameraAPI";
import ScreenSpaceGizmo from "../libs/gizmo/ScreenSpaceGizmo";

const EMPTY_COMPONENT = new TransformComponent()
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

    constructor() {
        EMPTY_COMPONENT.scaling = [.2, .2, .2]
        Transformation.transform(EMPTY_COMPONENT.translation, EMPTY_COMPONENT.rotationQuat, EMPTY_COMPONENT.scaling, EMPTY_COMPONENT.transformationMatrix)

        GizmoSystem.toBufferShader = new ShaderInstance(shaderCode.sameSizeVertex, shaderCode.fragment)
        GizmoSystem.gizmoShader = new ShaderInstance(gizmoShaderCode.vertex, gizmoShaderCode.fragment)

        this.translationGizmo = new Translation()
        this.scaleGizmo = new Scale()
        this.rotationGizmo = new Rotation()
    }


    static drawToDepthSampler(mesh, transforms) {

        gpu.disable(gpu.CULL_FACE)

        depthSystem.frameBuffer.startMapping()
        mesh.use()
        for (let i = 0; i < transforms.length; i++) {
            GizmoSystem.toBufferShader.bindForUse({
                viewMatrix: CameraAPI.viewMatrix,
                transformMatrix: transforms[i],
                projectionMatrix: CameraAPI.projectionMatrix,
                uID: [...getPickerId(i + 2), 1.],
                camPos: CameraAPI.position,
                translation: GizmoSystem.translation,
                cameraIsOrthographic: CameraAPI.isOrthographic
            })
            mesh.draw()
        }

        EditorRenderer.cubeMesh.use()
        GizmoSystem.toBufferShader.bindForUse({
            viewMatrix: CameraAPI.viewMatrix,
            transformMatrix: GizmoSystem.transformationMatrix,
            projectionMatrix: CameraAPI.projectionMatrix,
            uID: [...getPickerId(1), 1.],
            camPos: CameraAPI.position,
            translation: GizmoSystem.translation,
            cameraIsOrthographic: CameraAPI.isOrthographic
        })
        EditorRenderer.cubeMesh.draw()
        depthSystem.frameBuffer.stopMapping()

        gpu.enable(gpu.CULL_FACE)
        return depthSystem.frameBuffer
    }

    #findMainEntity() {
        const main = GizmoSystem.selectedEntities[0]
        if (Transformations.hasUpdatedItem || GizmoSystem.mainEntity !== main) {
            GizmoSystem.mainEntity = main
            GizmoSystem.translation = getEntityTranslation(main)

            const t = main.components[COMPONENTS.TRANSFORM]
            GizmoSystem.targetRotation = t !== undefined ? t.rotationQuat : [0, 0, 0, 1]
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
