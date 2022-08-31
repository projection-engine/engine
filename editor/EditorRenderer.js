import SpecularProbePass, {STEPS_CUBE_MAP} from "../production/templates/passes/SpecularProbePass"
import Wrapper from "./services/Wrapper"
import MaterialInstance from "../production/controllers/instances/MaterialInstance"
import * as debugCode from "./templates/DEBUG.glsl"
import * as shaderCode from "../production/data/shaders/FALLBACK.glsl"
import DATA_TYPES from "../production/data/DATA_TYPES"
import SHADING_MODELS from "../../../data/misc/SHADING_MODELS"
import DiffuseProbePass, {STEPS_LIGHT_PROBE} from "../production/templates/passes/DiffuseProbePass"
import BundlerAPI from "../production/libs/apis/BundlerAPI"
import ENVIRONMENT from "../production/data/ENVIRONMENT"
import CameraTracker from "./libs/CameraTracker";
import RendererController from "../production/controllers/RendererController.js";
import GizmoSystem from "./services/GizmoSystem";
import Entity from "../production/templates/Entity";
import Transformation from "../production/libs/Transformation";

function getCursor() {
    const entity = new Entity()
    entity.lockedRotation = true
    entity.lockedScaling = true
    entity.transformationMatrix = Transformation.transform(entity.translation, [0, 0, 0, 1], entity.scaling)
    return entity
}
export default class EditorRenderer extends RendererController {
    gizmo
    static cursor = getCursor()
    selected = []
    static sphereMesh
    static cameraMesh
    static cubeMesh
    static planeMesh
    constructor() {
        super()
        RendererController.environment = ENVIRONMENT.DEV
        this.editorSystem = new Wrapper()
        this.debugMaterial = new MaterialInstance({
            vertex: shaderCode.vertex,
            fragment: debugCode.fragment,
            uniformData: [{
                key: "shadingModel",
                data: SHADING_MODELS.DEPTH,
                type: DATA_TYPES.INT
            }],
            settings: {
                isForwardShaded: true,
                doubledSided: true
            },
            id: "shading-models"
        })

    }

    generatePreview(material) {
        return this.editorSystem.previewSystem.execute(this.data, material)
    }

    generateMeshPreview(entity, mesh) {
        return this.editorSystem.previewSystem.execute(this.data, mesh, entity)
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

        this.debugMaterial.uniformData.shadingModel = params.shadingModel
        BundlerAPI.build(
            {
                ...params,
                gizmo: this.gizmo,
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

