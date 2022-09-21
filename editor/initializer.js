import GPU from "../production/GPU";
import pointLightIcon from "../../../src/editor/data/icons/point_light.png";
import STATIC_TEXTURES from "../static/resources/STATIC_TEXTURES";
import directionalLightIcon from "../../../src/editor/data/icons/directional_light.png";
import probeIcon from "../../../src/editor/data/icons/probe.png";
import circle from "../../../src/editor/data/icons/circle.png";
import STATIC_SHADERS from "../static/resources/STATIC_SHADERS";
import * as gizmoShaderCode from "./templates/GIZMO.glsl";
import STATIC_MESHES from "../static/resources/STATIC_MESHES";
import CAMERA from "./data/CAMERA.json";
import PLANE from "./data/DUAL_AXIS_GIZMO.json";
import ROTATION_GIZMO from "./data/ROTATION_GIZMO.json";
import SCALE_GIZMO from "./data/SCALE_GIZMO.json";
import TRANSLATION_GIZMO from "./data/TRANSLATION_GIZMO.json";
import Engine from "../production/Engine";
import ENVIRONMENT from "../static/ENVIRONMENT";
import GridSystem from "./services/GridSystem";
import IconsSystem from "./services/IconsSystem";
import SelectedSystem from "./services/SelectedSystem";
import PreviewSystem from "./services/PreviewSystem";
import BackgroundSystem from "./services/BackgroundSystem";
import GizmoSystem from "./services/GizmoSystem";
import Entity from "../production/instances/Entity";
import TransformationAPI from "../production/apis/math/TransformationAPI";
import CollisionMeshInfoSystem from "./services/CollisionMeshInfoSystem";
import UIAPI from "../production/apis/UIAPI";
import DEBUGGlsl from "./templates/DEBUG.glsl";

function getCursor() {
    const entity = new Entity()
    entity.scaling = (new Array(3)).fill(.075)
    TransformationAPI.transform(entity.translation, [0, 0, 0, 1], entity.scaling, entity.matrix)
    return entity
}
export default async function initializer() {

    UIAPI.useIframe = true
    GPU.allocateTexture(pointLightIcon, STATIC_TEXTURES.POINT_LIGHT).catch()
    GPU.allocateTexture(directionalLightIcon, STATIC_TEXTURES.DIRECTIONAL_LIGHT).catch()
    GPU.allocateTexture(probeIcon, STATIC_TEXTURES.PROBE).catch()
    GPU.allocateTexture(circle, STATIC_TEXTURES.ROTATION_GIZMO).catch()

    GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.LINE, gizmoShaderCode.lineVertex, gizmoShaderCode.lineFragment)
    GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.TO_BUFFER, gizmoShaderCode.sameSizeVertex, gizmoShaderCode.pickFragment)
    GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.UNSHADED, gizmoShaderCode.cameraVertex, gizmoShaderCode.cameraFragment)
    GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.GIZMO, gizmoShaderCode.vertex, gizmoShaderCode.fragment)
    GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.DEBUG_DEFERRED, DEBUGGlsl.vertex, DEBUGGlsl.fragment)

    GPU.allocateMesh(STATIC_MESHES.EDITOR.CAMERA, CAMERA)
    GPU.allocateMesh(STATIC_MESHES.EDITOR.DUAL_AXIS_GIZMO, PLANE)
    GPU.allocateMesh(STATIC_MESHES.EDITOR.ROTATION_GIZMO, ROTATION_GIZMO)
    GPU.allocateMesh(STATIC_MESHES.EDITOR.SCALE_GIZMO, SCALE_GIZMO)
    GPU.allocateMesh(STATIC_MESHES.EDITOR.TRANSLATION_GIZMO, TRANSLATION_GIZMO)

    Engine.environment = ENVIRONMENT.DEV

    CollisionMeshInfoSystem.initialize()
    GridSystem.initialize()
    IconsSystem.initialize()
    SelectedSystem.initialize()
    PreviewSystem.initialize()
    BackgroundSystem.initialize()
    GizmoSystem.initialize()
    window.engineCursor = getCursor()

    await Engine.initialize()
}