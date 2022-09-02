import SpecularProbePass, {STEPS_CUBE_MAP} from "../production/templates/passes/SpecularProbePass"
import Wrapper from "./services/Wrapper"
import DiffuseProbePass, {STEPS_LIGHT_PROBE} from "../production/templates/passes/DiffuseProbePass"
import BundlerAPI from "../production/libs/BundlerAPI"
import ENVIRONMENT from "../production/data/ENVIRONMENT"
import CameraTracker from "./libs/CameraTracker";
import RendererController from "../production/controllers/RendererController.js";
import GizmoSystem from "./services/GizmoSystem";
import Entity from "../production/templates/Entity";
import TransformationAPI from "../production/libs/TransformationAPI";
import pointLightIcon from "../../../data/icons/point_light.png";
import directionalLightIcon from "../../../data/icons/directional_light.png";
import probeIcon from "../../../data/icons/probe.png";
import GPU from "../production/controllers/GPU";
import STATIC_TEXTURES from "../static/STATIC_TEXTURES";
import circle from "../../../data/icons/circle.png";
import STATIC_MESHES from "../static/STATIC_MESHES";
import CAMERA from "./data/CAMERA.json";
import * as cameraShaderCode from "./templates/GIZMO.glsl";
import * as gizmoShaderCode from "./templates/GIZMO.glsl";
import STATIC_SHADERS from "../static/STATIC_SHADERS";
import GridSystem from "./services/GridSystem";
import IconsSystem from "./services/IconsSystem";
import SelectedSystem from "./services/SelectedSystem";
import PreviewSystem from "./services/PreviewSystem";
import BackgroundSystem from "./services/BackgroundSystem";
import PLANE from "./data/DUAL_AXIS_GIZMO.json";
import ROTATION_GIZMO from "./data/ROTATION_GIZMO.json";
import SCALE_GIZMO from "./data/SCALE_GIZMO.json";
import TRANSLATION_GIZMO from "./data/TRANSLATION_GIZMO.json";

function getCursor() {
    const entity = new Entity()
    entity.lockedRotation = true
    entity.lockedScaling = true
    entity.scaling = (new Array(3)).fill(.13)
    entity.transformationMatrix = TransformationAPI.transform(entity.translation, [0, 0, 0, 1], entity.scaling)
    return entity
}

export default class EditorRenderer extends RendererController {
    static cursor = getCursor()

    constructor() {
        super()
        GPU.allocateTexture(pointLightIcon, STATIC_TEXTURES.POINT_LIGHT).catch()
        GPU.allocateTexture(directionalLightIcon, STATIC_TEXTURES.DIRECTIONAL_LIGHT).catch()
        GPU.allocateTexture(probeIcon, STATIC_TEXTURES.PROBE).catch()
        GPU.allocateTexture(circle, STATIC_TEXTURES.ROTATION_GIZMO).catch()
        GPU.allocateShader(STATIC_SHADERS.PRODUCTION.UNSHADED, cameraShaderCode.shadedVertex, cameraShaderCode.shadedFragment)
        GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.TO_BUFFER, gizmoShaderCode.sameSizeVertex, gizmoShaderCode.pickFragment)
        GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.GIZMO, gizmoShaderCode.vertex, gizmoShaderCode.fragment)

        GPU.allocateMesh(STATIC_MESHES.CAMERA, CAMERA)
        GPU.allocateMesh(STATIC_MESHES.DUAL_AXIS_GIZMO, PLANE)
        GPU.allocateMesh(STATIC_MESHES.ROTATION_GIZMO, ROTATION_GIZMO)
        GPU.allocateMesh(STATIC_MESHES.SCALE_GIZMO, SCALE_GIZMO)
        GPU.allocateMesh(STATIC_MESHES.TRANSLATION_GIZMO, TRANSLATION_GIZMO)

        RendererController.environment = ENVIRONMENT.DEV

        GridSystem.initialize()
        IconsSystem.initialize()
        SelectedSystem.initialize()
        PreviewSystem.initialize()
        BackgroundSystem.initialize()
        GizmoSystem.initialize()

        this.editorSystem = new Wrapper()

    }

    get gizmos() {
        return {
            rotation: GizmoSystem.rotationGizmo,
            translation: GizmoSystem.translationGizmo,
            scale: GizmoSystem.scaleGizmo
        }
    }

    refreshProbes() {
        DiffuseProbePass.step = STEPS_CUBE_MAP.BASE
        SpecularProbePass.step = STEPS_LIGHT_PROBE.GENERATION
    }

    updatePackage(prodEnv, params) {
        RendererController.environment = prodEnv ? ENVIRONMENT.EXECUTION : ENVIRONMENT.DEV
        if (!prodEnv)
            CameraTracker.startTracking()
        else
            CameraTracker.stopTracking()

        BundlerAPI.build(
            {
                ...params,
                onWrap: prodEnv ? null : this.editorSystem,
            })
    }

    arrayToObject(arr) {
        const obj = {}
        arr.forEach(a => {
            obj[a] = true
        })
        return obj
    }

    stop() {
        super.stop()
        CameraTracker.stopTracking()
    }

}

