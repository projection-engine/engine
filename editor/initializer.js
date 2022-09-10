import GPU from "../production/GPU";
import pointLightIcon from "../../../src/frontend/project/data/icons/point_light.png";
import STATIC_TEXTURES from "../static/STATIC_TEXTURES";
import directionalLightIcon from "../../../src/frontend/project/data/icons/directional_light.png";
import probeIcon from "../../../src/frontend/project/data/icons/probe.png";
import circle from "../../../src/frontend/project/data/icons/circle.png";
import STATIC_SHADERS from "../static/STATIC_SHADERS";
import * as gizmoShaderCode from "./templates/GIZMO.glsl";
import STATIC_MESHES from "../static/STATIC_MESHES";
import CAMERA from "./data/CAMERA.json";
import PLANE from "./data/DUAL_AXIS_GIZMO.json";
import ROTATION_GIZMO from "./data/ROTATION_GIZMO.json";
import SCALE_GIZMO from "./data/SCALE_GIZMO.json";
import TRANSLATION_GIZMO from "./data/TRANSLATION_GIZMO.json";
import Engine from "../production/Engine";
import ENVIRONMENT from "../production/data/ENVIRONMENT";
import GridSystem from "./services/GridSystem";
import IconsSystem from "./services/IconsSystem";
import SelectedSystem from "./services/SelectedSystem";
import PreviewSystem from "./services/PreviewSystem";
import BackgroundSystem from "./services/BackgroundSystem";
import GizmoSystem from "./services/GizmoSystem";
import Entity from "../production/instances/entity/Entity";
import TransformationAPI from "../production/apis/TransformationAPI";

function getCursor() {
    const entity = new Entity()
    entity.lockedRotation = true
    entity.lockedScaling = true
    entity.scaling = (new Array(3)).fill(.075)
    entity.transformationMatrix = TransformationAPI.transform(entity.translation, [0, 0, 0, 1], entity.scaling)
    return entity
}
export default function initializer() {
    GPU.allocateTexture(pointLightIcon, STATIC_TEXTURES.POINT_LIGHT).catch()
    GPU.allocateTexture(directionalLightIcon, STATIC_TEXTURES.DIRECTIONAL_LIGHT).catch()
    GPU.allocateTexture(probeIcon, STATIC_TEXTURES.PROBE).catch()
    GPU.allocateTexture(circle, STATIC_TEXTURES.ROTATION_GIZMO).catch()
    GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.TO_BUFFER, gizmoShaderCode.sameSizeVertex, gizmoShaderCode.pickFragment)
    GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.UNSHADED, gizmoShaderCode.cameraVertex, gizmoShaderCode.cameraFragment)
    GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.GIZMO, gizmoShaderCode.vertex, gizmoShaderCode.fragment)

    GPU.allocateMesh(STATIC_MESHES.EDITOR.CAMERA, CAMERA)
    GPU.allocateMesh(STATIC_MESHES.EDITOR.DUAL_AXIS_GIZMO, PLANE)
    GPU.allocateMesh(STATIC_MESHES.EDITOR.ROTATION_GIZMO, ROTATION_GIZMO)
    GPU.allocateMesh(STATIC_MESHES.EDITOR.SCALE_GIZMO, SCALE_GIZMO)
    GPU.allocateMesh(STATIC_MESHES.EDITOR.TRANSLATION_GIZMO, TRANSLATION_GIZMO)

    Engine.environment = ENVIRONMENT.DEV

    GridSystem.initialize()
    IconsSystem.initialize()
    SelectedSystem.initialize()
    PreviewSystem.initialize()
    BackgroundSystem.initialize()
    GizmoSystem.initialize()
    window.engineCursor = getCursor()

    Engine.initialize()
}