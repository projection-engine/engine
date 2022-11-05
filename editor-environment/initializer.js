import pointLightIcon from "../../../src/data/icons/point_light.png";
import STATIC_TEXTURES from "../static/resources/STATIC_TEXTURES";
import directionalLightIcon from "../../../src/data/icons/directional_light.png";
import probeIcon from "../../../src/data/icons/probe.png";
import circle from "../../../src/data/icons/circle.png";
import STATIC_SHADERS from "../static/resources/STATIC_SHADERS";
import * as gizmoShaderCode from "./shaders/GIZMO.glsl";
import STATIC_MESHES from "../static/resources/STATIC_MESHES";
import CAMERA from "./data/CAMERA.json";
import PLANE from "./data/DUAL_AXIS_GIZMO.json";
import ROTATION_GIZMO from "./data/ROTATION_GIZMO.json";
import SCALE_GIZMO from "./data/SCALE_GIZMO.json";
import TRANSLATION_GIZMO from "./data/TRANSLATION_GIZMO.json";
import Engine from "../Engine";
import ENVIRONMENT from "../static/ENVIRONMENT";
import GridSystem from "./services/GridSystem";
import IconsSystem from "./services/IconsSystem";
import SelectedSystem from "./services/SelectedSystem";
import PreviewSystem from "./services/PreviewSystem";
import BackgroundSystem from "./services/BackgroundSystem";
import GizmoSystem from "./services/GizmoSystem";
import CollisionVisualizationSystem from "./services/CollisionVisualizationSystem";
import UIAPI from "../api/UIAPI";
import DEBUGGlsl from "./shaders/DEBUG.glsl";
import ActionHistoryAPI from "../../../src/libs/ActionHistoryAPI";
import GPUAPI from "../api/GPUAPI";
import WIREFRAMEGlsl from "./shaders/WIREFRAME.glsl";
import RotationGizmo from "./libs/transformation/RotationGizmo";
import * as SKYBOX from "./shaders/SKYBOX.glsl";
import * as SELECTED from "./shaders/SELECTED.glsl"
import * as GRID from "./shaders/GRID.glsl";

export default async function initializer() {

    UIAPI.useIframe = true
    GPUAPI.allocateTexture(pointLightIcon, STATIC_TEXTURES.POINT_LIGHT).catch()
    GPUAPI.allocateTexture(directionalLightIcon, STATIC_TEXTURES.DIRECTIONAL_LIGHT).catch()
    GPUAPI.allocateTexture(probeIcon, STATIC_TEXTURES.PROBE).catch()
    GPUAPI.allocateTexture(circle, STATIC_TEXTURES.ROTATION_GIZMO).catch()

    GPUAPI.allocateShader(STATIC_SHADERS.DEVELOPMENT.LINE, gizmoShaderCode.lineVertex, gizmoShaderCode.lineFragment)
    GPUAPI.allocateShader(STATIC_SHADERS.DEVELOPMENT.TO_BUFFER, gizmoShaderCode.sameSizeVertex, gizmoShaderCode.pickFragment)
    GPUAPI.allocateShader(STATIC_SHADERS.DEVELOPMENT.UNSHADED, gizmoShaderCode.cameraVertex, gizmoShaderCode.cameraFragment)
    GPUAPI.allocateShader(STATIC_SHADERS.DEVELOPMENT.GIZMO, gizmoShaderCode.vertex, gizmoShaderCode.fragment)
    GPUAPI.allocateShader(STATIC_SHADERS.DEVELOPMENT.DEBUG_DEFERRED, DEBUGGlsl.vertex, DEBUGGlsl.fragment)
    CollisionVisualizationSystem.shader = GPUAPI.allocateShader(STATIC_SHADERS.DEVELOPMENT.WIREFRAME, WIREFRAMEGlsl.vertex, WIREFRAMEGlsl.fragment)
    RotationGizmo.shader = GPUAPI.allocateShader(STATIC_SHADERS.DEVELOPMENT.ROTATION_GIZMO, gizmoShaderCode.vertexRot, gizmoShaderCode.fragmentRot)
    BackgroundSystem.shader = GPUAPI.allocateShader(STATIC_SHADERS.DEVELOPMENT.BACKGROUND, SKYBOX.vertex, SKYBOX.fragment)
    GridSystem.shader = GPUAPI.allocateShader(STATIC_SHADERS.DEVELOPMENT.GRID, GRID.vertex, GRID.fragment)
    SelectedSystem.shaderSilhouette = GPUAPI.allocateShader(STATIC_SHADERS.DEVELOPMENT.SILHOUETTE, SELECTED.vertexSilhouette, SELECTED.fragmentSilhouette)
    SelectedSystem.shader = GPUAPI.allocateShader(STATIC_SHADERS.DEVELOPMENT.SILHOUETTE_OUTLINE, SELECTED.vertex, SELECTED.fragment)

    GPUAPI.allocateMesh(STATIC_MESHES.EDITOR.CAMERA, CAMERA)
    GPUAPI.allocateMesh(STATIC_MESHES.EDITOR.DUAL_AXIS_GIZMO, PLANE)
    GPUAPI.allocateMesh(STATIC_MESHES.EDITOR.ROTATION_GIZMO, ROTATION_GIZMO)
    GPUAPI.allocateMesh(STATIC_MESHES.EDITOR.SCALE_GIZMO, SCALE_GIZMO)
    GPUAPI.allocateMesh(STATIC_MESHES.EDITOR.TRANSLATION_GIZMO, TRANSLATION_GIZMO)

    Engine.environment = ENVIRONMENT.DEV

    CollisionVisualizationSystem.initialize()
    GridSystem.initialize()
    IconsSystem.initialize()
    SelectedSystem.initialize()
    PreviewSystem.initialize()
    GizmoSystem.initialize(ActionHistoryAPI.pushGroupChange)

}